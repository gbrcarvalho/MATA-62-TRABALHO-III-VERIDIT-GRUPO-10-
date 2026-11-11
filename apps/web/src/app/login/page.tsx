'use client';

import { useState, Suspense, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md">
        <h1 className="text-center text-2xl font-bold text-slate-900">{title}</h1>
        {children}
      </section>
    </main>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const params = useSearchParams();
  const registered = params.get('registered');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Acessar o Veridit">
      {registered && <div className="p-3 bg-green-100 text-green-700 rounded-md text-sm">Conta criada! Faça login.</div>}
      {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
          <input type="email" placeholder="seu@email.com" value={email}
            onChange={e => setEmail(e.target.value)} required 
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
          <input type="password" placeholder="Sua senha" value={password}
            onChange={e => setPassword(e.target.value)} required 
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-600 mt-4">
        Não tem conta? <Link href="/register" className="text-blue-600 font-semibold hover:underline">Cadastrar</Link>
      </p>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-center mt-10">Carregando...</p>}>
      <LoginForm />
    </Suspense>
  );
}