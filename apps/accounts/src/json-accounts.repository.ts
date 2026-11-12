import { readFile } from 'node:fs/promises'
import { AccountsRepository } from './interfaces/accounts-repository.interface.js'
import { Account } from './models/account.model.js'
import { Injectable, OnModuleInit } from '@nestjs/common'

@Injectable()
export class JsonAccountsRepository implements AccountsRepository, OnModuleInit {
    private _inMemoryDb: Account[]
    private _filePath: string

    async onModuleInit(): Promise<void> {
        this._filePath = './database/seed.json'
        this._inMemoryDb = await this._readAccounts()
    }

    private async _readAccounts(): Promise<Account[]> {
        try {
            const content = await readFile(this._filePath, 'utf-8')
            return JSON.parse(content)
        } catch (err: any) {
            if (err.code === 'ENOENT') return [] // arquivo ainda não existe
            throw err
        }
    }

    async findByEmail(email: string): Promise<Account | undefined> {
        return this._inMemoryDb.find(account => account.email.toLowerCase() === email.toLowerCase())
    }

    async findByCpf(cpf: string): Promise<Account | undefined> {
        const normalize = (value: string) => value.replace(/\D/g, '')
        return this._inMemoryDb.find(account => normalize(account.cpf) === normalize(cpf))
    }

    async create(account: Account): Promise<Account> {
        this._inMemoryDb.push(account)
        return account
    }
}