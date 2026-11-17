// apps/web/src/services/records.ts
import type { Record } from '@/types/record';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3009';
const TOKEN_KEY = 'token';

// era userId, mudei porque agora o frontend se comunica somente com o api gateway
export async function fetchRecords(): Promise<Record[]> {
  const params = new URLSearchParams({
    page: '1',
    pageSize: '10'
  });

  const token = localStorage.getItem(TOKEN_KEY) ?? '';

  const res = await fetch(`${API_URL}/records?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('Não autorizado. Faça login novamente.');
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Falha ao buscar registros');
  }

  const data = await res.json();

  // DEBUG
  console.log('Retorno do backend records:', data);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.records)) return data.records;

  return [];
}
