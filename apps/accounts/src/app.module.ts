import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller.js';
import { AccountsService } from './accounts.service.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthGuard } from './auth.guard.js';
import { TOKEN_REPOSITORY } from './interfaces/token-repository.interface.js';
import { InMemoryTokenRepository } from './inmemory-token.repository.js';
import { JsonAccountsRepository } from './json-accounts.repository.js';
import { ACCOUNTS_REPOSITORY } from './interfaces/accounts-repository.interface.js';

@Module({
  imports: [],
  controllers: [AccountsController, AuthController],
  providers: [
    AccountsService,
    AuthService,
    AuthGuard,
    { provide: TOKEN_REPOSITORY, useClass: InMemoryTokenRepository },
    { provide: ACCOUNTS_REPOSITORY, useClass: JsonAccountsRepository }
  ],
})
export class AppModule {}
