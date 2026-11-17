import { Account } from "../models/account.model.js"

export const ACCOUNTS_REPOSITORY = Symbol('ACCOUNTS_REPOSITORY')

export interface AccountsRepository {
    findByEmail: (email: string) => Promise<Account | undefined>
    findByCpf: (cpf: string) => Promise<Account | undefined>
    create: (account: Account) => Promise<Account>
}
