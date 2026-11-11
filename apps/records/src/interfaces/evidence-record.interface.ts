import { RecordStatus } from "../enums/record-status.enum.js"
import { DataType } from "../enums/data-type.enum.js"

export interface EvidenceRecord {
    recordId: string
    userId: string
    title: string
    startedAt: string
    finishedAt: string | null
    status: RecordStatus
    dataType: DataType[]
    nOfImages: number
    nOfVideos: number
}