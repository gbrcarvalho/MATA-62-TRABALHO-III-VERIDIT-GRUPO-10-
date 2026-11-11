// apps/web/src/types/record.ts

export interface Record {
  id: string;
  title: string;       // 🔧 ajuste conforme o backend
  description: string; // 🔧 ajuste conforme o backend
  status: string;      // 🔧 ajuste conforme o backend
  createdAt: string;   // 🔧 ajuste conforme o backend
}

export interface CreateRecordRequest {
  title: string;
  description: string;
  // ... outros campos necessários
}