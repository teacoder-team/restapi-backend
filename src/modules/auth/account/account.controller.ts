import {
	Body,
	Controller,
	FileTypeValidator,
	Get,
	HttpCode,
	HttpStatus,
	MaxFileSizeValidator,
	ParseFilePipe,
	Patch,
	Post,
	Req,
	Res,
	UploadedFile,
	UseGuards,
	UseInterceptors
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AuthGuard } from '@nestjs/passport'
import { FileInterceptor } from '@nestjs/platform-express'
import {
	ApiBadRequestResponse,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
	ApiTags,
	ApiUnauthorizedResponse
} from '@nestjs/swagger'
import { User } from '@prisma/generated'
import type { Request, Response } from 'express'

import { UserAgent } from '@/shared/decorators/user-agent.decorator'

import { Authorization } from '../../../shared/decorators/auth.decorator'
import { Authorized } from '../../../shared/decorators/authorized.decorator'

import { AccountService } from './account.service'
import { ChangePasswordDto } from './dto/change-password.dto'
import { CreateUserDto } from './dto/create-user.dto'
import { UserEntity } from './entities/user.entity'

@ApiTags('Account')
@Controller('auth/account')
export class AccountController {
	public constructor(
		private readonly accountService: AccountService,
		private readonly configService: ConfigService
	) {}

	@ApiOperation({ summary: 'Получить данные текущего пользователя' })
	@ApiOkResponse({
		description: 'Данные пользователя успешно получены',
		type: UserEntity
	})
	@ApiUnauthorizedResponse({
		description: 'Пользователь не авторизован'
	})
	@Authorization()
	@Get()
	@HttpCode(HttpStatus.OK)
	public async fetch(@Authorized() user: User) {
		return this.accountService.fetch(user)
	}

	@ApiOperation({ summary: 'Создать нового пользователя' })
	@ApiOkResponse({
		description: 'Пользователь успешно создан'
	})
	@ApiBadRequestResponse({
		description: 'Некорректные данные для создания пользователя'
	})
	@Post('create')
	@HttpCode(HttpStatus.OK)
	public async create(
		@Req() req: Request,
		@Body() dto: CreateUserDto,
		@UserAgent() userAgent: string
	) {
		return this.accountService.create(req, dto, userAgent)
	}

	@ApiOperation({ summary: 'Google OAuth аутентификация' })
	@UseGuards(AuthGuard('google'))
	@Get('google')
	public async googleAuth() {}

	@ApiOperation({ summary: 'Google OAuth callback' })
	@ApiOkResponse({
		description: 'OAuth успешно завершен'
	})
	@UseGuards(AuthGuard('google'))
	@Get('google/callback')
	public async googleAuthCallback(
		@Req() req: Request,
		@Res() res: Response,
		@UserAgent() userAgent: string
	) {
		await this.accountService.validateOAuth(req, userAgent)

		return res.redirect(
			this.configService.getOrThrow<string>('SITE_URL') + '/student'
		)
	}

	@ApiOperation({ summary: 'GitHub OAuth аутентификация' })
	@Get('github')
	@UseGuards(AuthGuard('github'))
	public async githubAuth() {}

	@ApiOperation({ summary: 'GitHub OAuth callback' })
	@ApiOkResponse({
		description: 'OAuth успешно завершен'
	})
	@Get('github/callback')
	@UseGuards(AuthGuard('github'))
	public async githubAuthCallback(
		@Req() req: Request,
		@Res() res: Response,
		@UserAgent() userAgent: string
	) {
		await this.accountService.validateOAuth(req, userAgent)

		return res.redirect(
			this.configService.getOrThrow<string>('SITE_URL') + '/student'
		)
	}

	@ApiOperation({ summary: 'Изменить пароль пользователя' })
	@ApiOkResponse({
		description: 'Пароль успешно изменен'
	})
	@ApiUnauthorizedResponse({
		description: 'Пользователь не авторизован'
	})
	@ApiBadRequestResponse({
		description: 'Некорректные данные для изменения пароля'
	})
	@Authorization()
	@Patch('change/password')
	@HttpCode(HttpStatus.OK)
	public async changePassword(
		@Authorized() user: User,
		@Body() dto: ChangePasswordDto
	) {
		return this.accountService.changePassword(user, dto)
	}

	@ApiOperation({ summary: 'Изменить аватар пользователя' })
	@ApiOkResponse({
		description: 'Аватар успешно обновлен'
	})
	@ApiUnauthorizedResponse({
		description: 'Пользователь не авторизован'
	})
	@ApiBadRequestResponse({
		description: 'Неверный формат файла или файл слишком большой'
	})
	@ApiParam({
		name: 'file',
		description: 'Изображение аватара пользователя (файл)',
		required: true
	})
	@Authorization()
	@UseInterceptors(
		FileInterceptor('file', {
			limits: {
				files: 1
			}
		})
	)
	@Patch('change/avatar')
	@HttpCode(HttpStatus.OK)
	public async changeAvatar(
		@Authorized() user: User,
		@UploadedFile(
			new ParseFilePipe({
				validators: [
					new FileTypeValidator({
						fileType: /\/(jpg|jpeg|png|gif|webp)$/
					}),
					new MaxFileSizeValidator({
						maxSize: 1000 * 1000 * 10,
						message: 'Можно загружать файлы не больше 10 МБ'
					})
				]
			})
		)
		file: Express.Multer.File
	) {
		return this.accountService.changeAvatar(user, file)
	}
}
