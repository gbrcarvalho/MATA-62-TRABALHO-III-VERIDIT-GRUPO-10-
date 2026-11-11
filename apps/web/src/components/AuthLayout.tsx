// apps/web/src/components/AuthLayout.tsx
import { ReactNode } from 'react';

export function AuthLayout({ title, children }: { title: string, children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-800">{title}</h1>
        </div>
        {children}
      </div>
    </div>
  );
}