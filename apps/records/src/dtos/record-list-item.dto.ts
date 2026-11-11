import { RecordStatus } from "../enums/record-status.enum.js";

export class RecordListItemDto {
    constructor(
        readonly recordId: string,
        readonly title: string,
        readonly startedAt: string,
        readonly finishedAt: string,
        readonly status: RecordStatus
    ) {}
}