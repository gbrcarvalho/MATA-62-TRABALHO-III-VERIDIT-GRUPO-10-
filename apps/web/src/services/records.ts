// apps/web/src/services/records.ts
import type { Record } from '@/types/record';

const RECORDS_API_URL = process.env.NEXT_PUBLIC_RECORDS_API_URL ?? 'http://localhost:3002';

// Array em memória para guardar as capturas simuladas na sessão atual
let MOCK_RECORDS: Record[] = [];

export async function fetchRecords(userId: string): Promise<Record[]> {
  try {
    // Tenta buscar do backend real primeiro
    const params = new URLSearchParams({ page: '1', pageSize: '10' });
    const res = await fetch(`${RECORDS_API_URL}/records?${params.toString()}`, {
      method: 'GET',
      headers: { 'x-user-id': userId },
    });

    if (res.ok) {
      const data = await res.json();
      let realRecords: Record[] = [];
      if (Array.isArray(data)) realRecords = data;
      else if (Array.isArray(data.items)) realRecords = data.items;
      else if (Array.isArray(data.data)) realRecords = data.data;
      
      // Retorna a junção do que veio do backend com as simulações locais
      return [...realRecords, ...MOCK_RECORDS];
    }
  } catch (err) {
    console.warn("Backend offline. Usando apenas simulações locais.");
  }
  
  // Se o backend falhar ou estiver vazio, retorna as simulações
  return MOCK_RECORDS;
}

// 👇 Nova função para simular a chegada da captura externa
export async function simulateCapture(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newRecord: Record = {
        id: `mock-${Date.now()}`,
        title: 'Nova Captura de Tela',
        description: 'Processamento automático via serviço de captura.',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        clientName: 'Cliente Teste',
        caseNumber: `PROC-${Math.floor(Math.random() * 10000)}`,
      };
      
      // Adiciona no topo da lista
      MOCK_RECORDS = [newRecord, ...MOCK_RECORDS];
      resolve();
    }, 2000); // Simula os 2 segundos de processamento
  });
}