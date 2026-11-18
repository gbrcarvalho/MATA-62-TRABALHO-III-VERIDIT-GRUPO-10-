import { BadRequestException, ConflictException, Injectable, Inject } from '@nestjs/common';
import { CreateAccountDto } from './dtos/create-account.dto.js';
import * as AccountsRepository from './interfaces/accounts-repository.interface.js';
import { Account } from './models/account.model.js';
import { randomUUID } from 'node:crypto';
import { UserType } from './enums/user-type.enum.js';
import * as PasswordHasher from './interfaces/password-hasher.interface.js';

const ACCOUNTS_REPOSITORY = AccountsRepository.ACCOUNTS_REPOSITORY
type AccountsRepository = AccountsRepository.AccountsRepository

const PASSWORD_HASHER = PasswordHasher.PASSWORD_HASHER
type PasswordHasher = PasswordHasher.PasswordHasher

@Injectable()
export class CreateAccountsService {
  private uuidGenerator = () => randomUUID()

  constructor(
    @Inject(ACCOUNTS_REPOSITORY) private readonly accountsRepository: AccountsRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher
  ) {}

  async createAccount(createAccountDto: CreateAccountDto): Promise<Account> {
    const { name, email, password, cpf, oab, type } = createAccountDto

    const sameEmailAcc = await this.accountsRepository.findByEmail(email)
    if (sameEmailAcc) throw new ConflictException("The given email is already being used.")

    /* TODO:
    implementar aqui chamada a serviço externo que valida
    se o email existe.
    */

    const sameCpfAcc = await this.accountsRepository.findByCpf(cpf)
    if (sameCpfAcc) throw new ConflictException("The given CPF is already being used.")

    /* TODO:
    implementar aqui chamada a serviço externo que valida
    se o cpf existe e pertence a pessoa cadastrada.
    */

    let account: Account
    if (type == UserType.LAWYER) {
      let oabIsValid: boolean
      if (typeof(oab) !== 'string') {
        oabIsValid = false
      } else {
        oabIsValid = true
      }
      /* TODO:
      implementar aqui chamada a serviço externo que valida
      o numero da OAB no que diz respeito a existencia e ao
      pertencimento a pessoa que foi informada.
      */
      if (!oabIsValid) throw new BadRequestException('The given OAB is invalid.')

      account = new Account(
        this.uuidGenerator(),
        name,
        email,
        this.passwordHasher.hash(password),
        cpf,
        oab,
        type,
        new Date()
      )
    } else {
      account = new Account(
        this.uuidGenerator(),
        name,
        email,
        this.passwordHasher.hash(password),
        cpf,
        null,
        type,
        new Date()
      )
    }

    await this.accountsRepository.create(account)
    return account
  }

  async findByEmail(email: string): Promise<Account | undefined> {
    return await this.accountsRepository.findByEmail(email)
  }
}
