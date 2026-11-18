import { Account } from "../../src/models/account.model.js"
import { AccountsRepository } from "../../src/interfaces/accounts-repository.interface.js"

/**
 * Repositório em memória usado só nos testes, para não depender
 * (nem alterar) o ./database/seed.json.
 */
export class FakeAccountsRepository implements AccountsRepository {
  db: Account[] = []

  async findByEmail(email: string) {
    return this.db.find(a => a.email.toLowerCase() === email.toLowerCase())
  }

  async findByCpf(cpf: string) {
    const normalize = (v: string) => v.replace(/\D/g, '')
    return this.db.find(a => normalize(a.cpf) === normalize(cpf))
  }

  async create(account: Account) {
    this.db.push(account)
    return account
  }

  reset() {
    this.db = []
  }
}
