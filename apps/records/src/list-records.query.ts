import { RecordStatus } from "./enums/record-status.enum.js";

export class ListRecordsQuery {
    readonly page: number
    readonly pageSize: number
    readonly status?: RecordStatus

    constructor(query: Record<string, string>) {
        const { page, pageSize, status } = query
        if (!page) throw new Error('You should specify which page!')
                
        this.page = Number(page)
        if (Number.isNaN(this.page)) throw new Error('Given page is not a valid number!')

        this.pageSize = Number(pageSize) || 10

        if (typeof(status) == 'string' && status in RecordStatus && Number.isNaN(Number(status))) {
            this.status = RecordStatus[status as keyof typeof RecordStatus]
        }
    }
}