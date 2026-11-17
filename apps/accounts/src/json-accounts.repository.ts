import { readFile } from 'node:fs/promises'
import { AccountsRepository } from './interfaces/accounts-repository.interface.js'
import { Account } from './models/account.model.js'
import { Injectable, OnModuleInit } from '@nestjs/common'

@Injectable()
export class JsonAccountsRepository implements AccountsRepository, OnModuleInit {
    private inMemoryDb: Account[]
    private filePath: string

    async onModuleInit(): Promise<void> {
        this.filePath = './database/seed.json'
        this.inMemoryDb = await this.readAccounts()
    }

    private async readAccounts(): Promise<Account[]> {
        try {
            const content = await readFile(this.filePath, 'utf-8')
            return JSON.parse(content)
        } catch (err: any) {
            if (err.code === 'ENOENT') return [] // arquivo ainda não existe
            throw err
        }
    }

    async findByEmail(email: string): Promise<Account | undefined> {
        return this.inMemoryDb.find(account => account.email.toLowerCase() === email.toLowerCase())
    }

    async findByCpf(cpf: string): Promise<Account | undefined> {
        const normalize = (value: string) => value.replace(/\D/g, '')
        return this.inMemoryDb.find(account => normalize(account.cpf) === normalize(cpf))
    }

    async create(account: Account): Promise<Account> {
        this.inMemoryDb.push(account)
        return account
    }
}