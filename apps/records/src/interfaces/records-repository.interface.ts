import { ListRecordsQuery } from "../list-records.query.js"
import { PaginatedResult } from "../paginated-result.js"
import { EvidenceRecord } from "./evidence-record.interface.js"

export const RECORDS_REPOSITORY = Symbol('ACCOUNTS_REPOSITORY')

export interface RecordsRepository {
    findByUser: (userId: string, query: ListRecordsQuery) => Promise<PaginatedResult<EvidenceRecord>>
    findByIdAndUser: (recordId: string, userId: string) => Promise<EvidenceRecord | undefined>
}