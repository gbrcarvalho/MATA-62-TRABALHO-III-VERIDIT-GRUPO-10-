import { Module } from '@nestjs/common';
import { RecordsController } from './records.controller.js';
import { RecordsService } from './records.service.js';
import { RECORDS_REPOSITORY } from './interfaces/records-repository.interface.js';
import { JsonRecordsRepository } from './json-records.repository.js';

@Module({
  imports: [],
  controllers: [RecordsController],
  providers: [
    RecordsService,
    { provide: RECORDS_REPOSITORY, useClass: JsonRecordsRepository }
  ],
})
export class AppModule {}