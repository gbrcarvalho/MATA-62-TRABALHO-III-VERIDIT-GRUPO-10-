import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dtos/login.dto.js';
import { AccountResponseDto } from './dtos/account-response.dto.js';
import { AuthResponseDto } from './dtos/auth-response.dto.js';
import { JwtService } from './jwt.service.js';
import * as TokenRepository from './interfaces/token-repository.interface.js';
import * as AccountsRepository from './interfaces/accounts-repository.interface.js';
import * as PasswordHasher from './interfaces/password-hasher.interface.js';

const TOKEN_REPOSITORY = TokenRepository.TOKEN_REPOSITORY
type TokenRepository = TokenRepository.TokenRepository

const ACCOUNTS_REPOSITORY = AccountsRepository.ACCOUNTS_REPOSITORY
type AccountsRepository = AccountsRepository.AccountsRepository

const PASSWORD_HASHER = PasswordHasher.PASSWORD_HASHER
type PasswordHasher = PasswordHasher.PasswordHasher

@Injectable()
export class AuthService {
  constructor(
    @Inject(TOKEN_REPOSITORY) private readonly tokenRepository: TokenRepository,
    @Inject(ACCOUNTS_REPOSITORY) private readonly accountsRepository: AccountsRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    private readonly jwtService: JwtService
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const account = await this.accountsRepository.findByEmail(loginDto.email)
    if (!account) throw new UnauthorizedException('Email e/ou senha, inválidos!')

    const correctPassword = this.passwordHasher.compare(loginDto.password, account.passwordHash)
    if (!correctPassword) throw new UnauthorizedException('Email e/ou senha, inválidos!')

    const accessToken = this.jwtService.sign({ sub: account.id, email: account.email, type: account.type })

    return AuthResponseDto.create(accessToken, 'Bearer', this.jwtService.expiresInSeconds, AccountResponseDto.create(account))
  }

  logout(token: string): void {
    this.tokenRepository.revoke(token)
  }
}
