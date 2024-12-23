import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Req
} from '@nestjs/common'
import {
	ApiBadRequestResponse,
	ApiConflictResponse,
	ApiInternalServerErrorResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
	ApiTags,
	ApiUnauthorizedResponse
} from '@nestjs/swagger'
import { User } from '@prisma/generated'
import { Request } from 'express'
import { Turnstile } from 'nestjs-cloudflare-captcha'

import { Authorized } from '@/shared/decorators/authorized.decorator'
import { UserAgent } from '@/shared/decorators/user-agent.decorator'

import { Authorization } from '../../../shared/decorators/auth.decorator'
import { UserEntity } from '../account/entities/user.entity'

import { LoginDto } from './dto/login.dto'
import { SessionEntity } from './entities/session.entity'
import { SessionService } from './session.service'

@ApiTags('Session')
@Controller('auth/session')
export class SessionController {
	public constructor(private readonly sessionService: SessionService) {}

	@ApiOperation({ summary: 'Войти в систему' })
	@ApiOkResponse({
		description: 'Пользователь успешно авторизован',
		type: UserEntity
	})
	@ApiNotFoundResponse({
		description: 'Пользователь не найден'
	})
	@ApiBadRequestResponse({
		description: 'Некорректные данные для входа в систему'
	})
	@Turnstile()
	@Post('login')
	@HttpCode(HttpStatus.OK)
	public async login(
		@Req() req: Request,
		@Body() dto: LoginDto,
		@UserAgent() userAgent: string
	) {
		return this.sessionService.login(req, dto, userAgent)
	}

	@ApiOperation({ summary: 'Выйти из системы' })
	@ApiOkResponse({
		description: 'Пользователь успешно вышел из системы'
	})
	@ApiInternalServerErrorResponse({
		description: 'Не удалось завершить сессию'
	})
	@Post('logout')
	@HttpCode(HttpStatus.OK)
	public async logout(@Req() req: Request) {
		return this.sessionService.logout(req)
	}

	@ApiOperation({
		summary: 'Получить все активные сессии для пользователя'
	})
	@ApiOkResponse({
		description: 'Список всех активных сессий',
		type: [SessionEntity]
	})
	@ApiUnauthorizedResponse({
		description: 'Неавторизованный доступ'
	})
	@Get('all')
	@HttpCode(HttpStatus.OK)
	@Authorization()
	public async findAll(@Req() req: Request, @Authorized() user: User) {
		return this.sessionService.findAll(req, user)
	}

	@ApiOperation({ summary: 'Получить данные текущей активной сессии' })
	@ApiOkResponse({
		description: 'Данные текущей сессии',
		type: SessionEntity
	})
	@ApiNotFoundResponse({
		description: 'Сессия не найдена'
	})
	@Authorization()
	@Get('current')
	@HttpCode(HttpStatus.OK)
	public async findCurrent(@Req() req: Request, @Authorized() user: User) {
		return this.sessionService.findCurrent(req, user)
	}

	@ApiOperation({ summary: 'Удалить конкретную сессию по ID' })
	@ApiParam({ name: 'id', description: 'ID сессии для удаления' })
	@ApiOkResponse({
		description: 'Сессия успешно удалена'
	})
	@ApiConflictResponse({
		description: 'Невозможно удалить текущую сессию'
	})
	@Delete('remove/:id')
	@HttpCode(HttpStatus.OK)
	public async remove(@Req() req: Request, @Param('id') id: string) {
		return this.sessionService.remove(req, id)
	}
}
