import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller.js';
import { CreateAccountsService } from './create-accounts.service.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthGuard } from './auth.guard.js';
import { TOKEN_REPOSITORY } from './interfaces/token-repository.interface.js';
import { InMemoryTokenRepository } from './inmemory-token.repository.js';
import { JsonAccountsRepository } from './json-accounts.repository.js';
import { ACCOUNTS_REPOSITORY } from './interfaces/accounts-repository.interface.js';
import { PASSWORD_HASHER } from './interfaces/password-hasher.interface.js';
import { ConcretePasswordHasher } from './password-hasher.js';
import { JwtService } from './jwt.service.js';

@Module({
  imports: [],
  controllers: [AccountsController, AuthController],
  providers: [
    CreateAccountsService,
    AuthService,
    AuthGuard,
    JwtService,
    { provide: TOKEN_REPOSITORY, useClass: InMemoryTokenRepository },
    { provide: ACCOUNTS_REPOSITORY, useClass: JsonAccountsRepository },
    { provide: PASSWORD_HASHER, useClass: ConcretePasswordHasher },
  ],
})
export class AppModule {}
