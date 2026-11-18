// apps/web/src/types/record.ts

export interface Record {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  clientName?: string;
  caseNumber?: string;
}

export interface CreateRecordRequest {
  title: string;
  description: string;
  // ... outros campos necessários
}