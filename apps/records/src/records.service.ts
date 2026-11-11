import { Injectable } from '@nestjs/common';
import { PaginatedResult } from './paginated-result.js';
import { RecordListItemDto } from './dtos/record-list-item.dto.js';
import { RecordDetailDto } from './dtos/record-detail.dto.js';
import { RecordsRepository } from './interfaces/records-repository.interface.js';
import { ListRecordsQuery } from './list-records.query.js';
import { JsonRecordsRepository } from './json-records.repository.js';

@Injectable()
export class RecordsService {
  private _recordsRepository: RecordsRepository = new JsonRecordsRepository()

  async list(userId: string, query: ListRecordsQuery): Promise<PaginatedResult<RecordListItemDto>> {
    const { page, pageSize } = query
    const records = await this._recordsRepository.findByUser(userId, query)
    const recordListItems = records.items.map(rec => {
      const { recordId, title, startedAt, finishedAt, status } = rec
      return new RecordListItemDto(recordId, title, startedAt, finishedAt ?? '', status)
    }) as unknown as RecordListItemDto[]

    return new PaginatedResult<RecordListItemDto>(
      recordListItems,
      page,
      pageSize,
      records.items.length
    )
  }

  async getById(userIdHeader: string, recordIdParam: string): Promise<RecordDetailDto | undefined> {
    const record = await this._recordsRepository.findByIdAndUser(recordIdParam, userIdHeader)
    if (!record) return

    const { recordId, title, startedAt, finishedAt, dataType, status, nOfImages, nOfVideos, userId } = record
    return new RecordDetailDto(recordId, title, startedAt, finishedAt ?? '', status, dataType, nOfImages, nOfVideos, userId)
  }
}
