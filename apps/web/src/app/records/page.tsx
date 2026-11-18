// apps/web/src/app/records/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { fetchRecords, simulateCapture } from '@/services/records'; // Importação atualizada
import type { Record } from '@/types/record';

export default function RecordsPage() {
  const { user, loading: authLoading } = useAuth();
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estado para o Modal
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);

  // Estados para o Simulador de Captura
  const [isSimulating, setIsSimulating] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Função para buscar os dados (isolada para podermos reutilizar)
  const loadRecords = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      const data = await fetchRecords();
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Busca inicial ao carregar a página
  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Função do Botão Simulador Atualizada
  async function handleSimulateCapture() {
    setIsSimulating(true);
    setToastMessage('Processando nova captura...');

    try {
      await simulateCapture(); // Simula o serviço externo criando o dado
      await loadRecords();     // Recarrega a lista com o novo dado
      setToastMessage('Captura processada com sucesso!');
    } catch (e) {
      setToastMessage('Erro ao processar captura.');
    } finally {
      setIsSimulating(false);
      setTimeout(() => setToastMessage(''), 3000);
    }
  }

  if (authLoading || (loading && records.length === 0 && !error)) {
    return <p className="text-center mt-10">Carregando registros...</p>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-8 relative">
      <div className="max-w-4xl mx-auto space-y-8">

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Meus Registros</h1>
            <p className="text-slate-500 mt-1">Gerencie as capturas de tela do sistema Veridit</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleSimulateCapture}
              disabled={isSimulating || loading}
              className="bg-emerald-600 text-white px-4 py-2 rounded-md font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSimulating ? 'Processando...' : '📸 Simular Captura'}
            </button>
            <Link href="/profile" className="px-4 py-2 text-blue-600 hover:underline font-medium border border-slate-200 rounded-md bg-white">
              Voltar
            </Link>
          </div>
        </div>

        {/* Tratamento de Erro */}
        {error && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
            <p className="text-red-700 font-medium mb-4">{error}</p>
            <button
              onClick={loadRecords}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors font-medium text-sm"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Lista de Registros (Empty State e Cards) */}
        {!error && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-200">
            {records.length === 0 && !loading ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                <span className="text-4xl mb-4">📭</span>
                <p className="text-lg font-medium">Nenhum registro encontrado.</p>
                <p className="text-sm mt-1">Clique em "Simular Captura" para gerar um novo registro.</p>
              </div>
            ) : (
              records.map(record => (
                <div
                  key={record.id}
                  onClick={() => setSelectedRecord(record)}
                  className="p-6 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">{record.title}</h3>
                      <p className="text-slate-600 mt-1">{record.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      record.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {record.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-4">
                    Criado em: {new Date(record.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* MODAL DE DETALHES DO REGISTRO */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Detalhes da Captura</h2>
              <button onClick={() => setSelectedRecord(null)} className="text-slate-400 hover:text-slate-700 text-2xl font-bold">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Título</p>
                <p className="text-lg text-slate-800 font-semibold">{selectedRecord.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Descrição</p>
                <p className="text-slate-700">{selectedRecord.description}</p>
              </div>
              {selectedRecord.clientName && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Cliente</p>
                    <p className="text-slate-800">{selectedRecord.clientName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Número do Processo</p>
                    <p className="text-slate-800">{selectedRecord.caseNumber}</p>
                  </div>
                </div>
              )}
              <div className="pt-2 flex justify-between items-center">
                <div>
                   <p className="text-sm font-medium text-slate-500">Data de Criação</p>
                   <p className="text-slate-800">{new Date(selectedRecord.createdAt).toLocaleString('pt-BR')}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selectedRecord.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {selectedRecord.status}
                </span>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setSelectedRecord(null)} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-md hover:bg-slate-300 transition-colors">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 TOAST DE NOTIFICAÇÃO */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom-5">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
