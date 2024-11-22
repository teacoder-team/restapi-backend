import { Module } from '@nestjs/common'

import { TelegramService } from '@/modules/libs/telegram/telegram.service'
import { SessionSerializer } from '@/shared/serializers/session.serializer'
import { GitHubStrategy } from '@/shared/strategies/github.strategy'
import { GoogleStrategy } from '@/shared/strategies/google.strategy'

import { AccountController } from './account.controller'
import { AccountService } from './account.service'

@Module({
	controllers: [AccountController],
	providers: [
		AccountService,
		SessionSerializer,
		TelegramService,
		GoogleStrategy,
		GitHubStrategy
	]
})
export class AccountModule {}
