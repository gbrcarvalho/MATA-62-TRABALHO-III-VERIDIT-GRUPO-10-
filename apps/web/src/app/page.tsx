'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { userTypeLabel } from '@/types/auth';

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading) return <p className="text-center mt-10">Carregando...</p>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Cabeçalho */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-800">Veridit</h1>
          <button onClick={() => logout()} 
            className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors">
            Sair
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center gap-4">
            <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{user.name}</h2>
              <p className="text-slate-500">{user.email}</p>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-slate-500">CPF</p>
              <p className="text-lg text-slate-800">{user.cpf}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">OAB</p>
              <p className="text-lg text-slate-800">{user.oab ?? 'Não informada'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Tipo de Conta</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                {userTypeLabel(user.type)}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Membro desde</p>
              <p className="text-lg text-slate-800">{new Date(user.createAt).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}