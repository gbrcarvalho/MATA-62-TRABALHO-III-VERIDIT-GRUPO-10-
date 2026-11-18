import { readFile } from 'node:fs/promises'
import { RecordsRepository } from './interfaces/records-repository.interface.js'
import { EvidenceRecord } from './interfaces/evidence-record.interface.js'
import { PaginatedResult } from './paginated-result.js'
import { ListRecordsQuery } from './list-records.query.js'
import { Injectable, OnModuleInit } from '@nestjs/common'

export function paginate<T>(items: T[], page: number, pageSize: number) {
    const total = items.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    const start = (page - 1) * pageSize
    const end = start + pageSize

    return {
        items: items.slice(start, end),
        total,
        page,
        pageSize,
        totalPages,
    }
}

@Injectable()
export class JsonRecordsRepository implements RecordsRepository, OnModuleInit {
    private _inMemoryDb: EvidenceRecord[]
    private _filePath: string

    async onModuleInit(): Promise<void> {
        this._filePath = './database/seed.json'
        this._inMemoryDb = await this._readEvidenceRecords()
    }

    private async _readEvidenceRecords(): Promise<EvidenceRecord[]> {
        try {
            const content = await readFile(this._filePath, 'utf-8')
            return JSON.parse(content)
        } catch (err: any) {
            if (err.code === 'ENOENT') return [] // arquivo ainda não existe
            throw err
        }
    }

    async findByUser(userId: string, query: ListRecordsQuery): Promise<PaginatedResult<EvidenceRecord>> {
        const { page, pageSize, status } = query
        const records = this._inMemoryDb//await this._readEvidenceRecords()
        const recordPage = paginate(records, page, pageSize).items

        let filteredRecordPage: EvidenceRecord[]
        if (status) {
            filteredRecordPage = recordPage.filter(rec => rec.userId === userId && rec.status === status)
        } else {
            filteredRecordPage = recordPage.filter(rec => rec.userId === userId)
        }

        return new PaginatedResult<EvidenceRecord>(filteredRecordPage, page, pageSize, filteredRecordPage.length)
    }

    async findByIdAndUser(recordId: string, userId: string): Promise<EvidenceRecord | undefined> {
        const records = this._inMemoryDb//await this._readEvidenceRecords()
        const filteredRecords = records.filter(rec => rec.userId === userId)
        return filteredRecords.find(rec => rec.recordId === recordId)
    }
}