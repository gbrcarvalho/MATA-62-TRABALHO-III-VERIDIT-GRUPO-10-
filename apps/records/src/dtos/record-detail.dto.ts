import { DataType } from "../enums/data-type.enum.js";
import { RecordStatus } from "../enums/record-status.enum.js";

export class RecordDetailDto {
    constructor(
        readonly recordId: string,
        readonly title: string,
        readonly startedAt: string,
        readonly finishedAt: string,
        readonly status: RecordStatus,
        readonly dataType: DataType[],
        readonly nOfImages: number,
        readonly nOfIVideos: number,
        readonly userId: string
    ) {}
}