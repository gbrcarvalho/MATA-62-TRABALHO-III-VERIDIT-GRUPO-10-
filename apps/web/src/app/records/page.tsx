'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { fetchRecords } from '@/services/records';
import type { Record } from '@/types/record';

export default function RecordsPage() {
  const { user, loading: authLoading } = useAuth();
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Só busca se o usuário estiver logado
    if (!user) return;
    
    fetchRecords(user.id)
      .then(setRecords)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || loading) return <p className="text-center mt-10">Carregando...</p>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-800">Meus Registros</h1>
          <Link href="/profile" className="text-blue-600 hover:underline">
            Voltar ao Perfil
          </Link>
        </div>

        {error && <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

        {/* Lista de registros */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-200">
          {!Array.isArray(records) || records.length === 0 ? (
            <p className="p-6 text-slate-500">Nenhum registro encontrado no sistema.</p>
          ) : (
            records.map(record => (
              <div key={record.id} className="p-6">
                <h3 className="text-lg font-semibold text-slate-800">{record.title || 'Sem título'}</h3>
                <p className="text-slate-600">{record.description || 'Sem descrição'}</p>
              </div>
            ))
          )}
        </div>

        <div className="bg-yellow-50 p-4 border border-yellow-200 rounded-md text-yellow-800 text-sm">
          <strong>Aviso para o grupo:</strong> A criação de registros será habilitada assim que o backend de <code>records</code> implementar a rota <code>@Post()</code> no controller.
        </div>

      </div>
    </div>
  );
}