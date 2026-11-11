// apps/web/src/services/records.ts
import type { Record } from '@/types/record';

const RECORDS_API_URL = process.env.NEXT_PUBLIC_RECORDS_API_URL ?? 'http://localhost:3002';

export async function fetchRecords(userId: string): Promise<Record[]> {
  const params = new URLSearchParams({
    page: '1',
    pageSize: '10'
  });

  const res = await fetch(`${RECORDS_API_URL}/records?${params.toString()}`, {
    method: 'GET',
    headers: {
      'x-user-id': userId,
    },
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('Não autorizado. Faça login novamente.');
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Falha ao buscar registros');
  }

  const data = await res.json();
  
  // 🚨 DEBUG: Isso vai imprimir no console do navegador (F12) o que o backend enviou
  console.log('Retorno do backend records:', data);

  // Garante que o retorno seja SEMPRE um array
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.records)) return data.records;
  
  return []; // Se não achar nada, retorna vazio para não quebrar a tela
}