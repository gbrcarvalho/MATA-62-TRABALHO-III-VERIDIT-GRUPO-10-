import { BadRequestException, Controller, Get, Headers, NotFoundException, Param, Query, UnauthorizedException } from '@nestjs/common';
import { RecordsService } from './records.service.js';
import { RecordDetailDto } from './dtos/record-detail.dto.js';
import { PaginatedResult } from './paginated-result.js';
import { RecordListItemDto } from './dtos/record-list-item.dto.js';
import { ListRecordsQuery } from './list-records.query.js';

@Controller('records')
export class RecordsController {
  constructor(private readonly _recordsService: RecordsService) {}

  @Get()
  async list(@Headers('x-user-id') userIdHeader: string, @Query() query: Record<string, string>): Promise<PaginatedResult<RecordListItemDto>> {
    if (!userIdHeader) throw new UnauthorizedException('Não Autenticado!')

    let listRecordsQuery: ListRecordsQuery
    try {
      listRecordsQuery = new ListRecordsQuery(query)
    } catch(err) {
      throw new BadRequestException(err)
    }

    return await this._recordsService.list(userIdHeader, listRecordsQuery)
  }

  @Get(':recordId')
  async getById(@Headers('x-user-id') userIdHeader: string, @Param('recordId') recordId: string): Promise<RecordDetailDto> {
    if (!userIdHeader) throw new UnauthorizedException('Não Autenticado!')
    
    const record = await this._recordsService.getById(userIdHeader, recordId)
    if (!record) throw new NotFoundException("Não Encontrado")

    return record
  }
}
