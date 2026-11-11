'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { RegisterRequest, UserTypeStr } from '@/types/auth';
import type { ReactNode } from 'react';

function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <section className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md">
        <h1 className="text-center text-2xl font-bold text-slate-900">{title}</h1>
        {children}
      </section>
    </main>
  );
}

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterRequest>({
    name: '',
    email: '',
    password: '',
    cpf: '',
    oab: '',
    type: 'COMMON',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function update<K extends keyof RegisterRequest>(key: K, value: RegisterRequest[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload: RegisterRequest = {
        name: form.name,
        email: form.email,
        password: form.password,
        cpf: form.cpf,
        type: form.type,
        ...(form.oab?.trim() ? { oab: form.oab.trim() } : {}),
      };

      await api('/accounts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      router.push('/login?registered=1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Criar conta">
      {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
          <input type="text" placeholder="Seu nome" value={form.name}
            onChange={e => update('name', e.target.value)} required 
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
          <input type="email" placeholder="seu@email.com" value={form.email}
            onChange={e => update('email', e.target.value)} required 
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
          <input type="password" placeholder="Mínimo 6 caracteres" value={form.password}
            onChange={e => update('password', e.target.value)} required minLength={6} 
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
            <input type="text" placeholder="000.000.000-00" value={form.cpf}
              onChange={e => update('cpf', e.target.value)} required 
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">OAB (Opcional)</label>
            <input type="text" placeholder="000000" value={form.oab ?? ''}
              onChange={e => update('oab', e.target.value)} 
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Conta</label>
          <select value={form.type} onChange={e => update('type', e.target.value as UserTypeStr)}
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="COMMON">Comum</option>
            <option value="LAWYER">Advogado</option>
          </select>
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50">
          {loading ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-600 mt-4">
        Já tem conta? <Link href="/login" className="text-blue-600 font-semibold hover:underline">Entrar</Link>
      </p>
    </AuthLayout>
  );
}