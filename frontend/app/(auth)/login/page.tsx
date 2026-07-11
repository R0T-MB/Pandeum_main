'use client';
import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      window.location.href = '/';
    } catch (error) {
      alert('Error al iniciar sesión');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0F172A]">
      <div className="bg-white dark:bg-[#1E293B] p-8 rounded-xl border border-slate-200 dark:border-slate-700 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-slate-900 dark:text-slate-100">Pandeum</h1>
        <p className="text-center text-slate-500 dark:text-slate-400 mt-2">Inicia sesión para continuar</p>
        
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]/20 transition-shadow" required />
          <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]/20 transition-shadow" required />
          <button type="submit" className="w-full bg-[#1E3A5F] hover:bg-[#2F5D7C] text-white font-medium py-2.5 rounded-lg transition-colors">Ingresar</button>
        </form>
        
        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">¿No tienes cuenta? <Link href="/register" className="text-[#1E3A5F] dark:text-[#2F5D7C] font-medium hover:underline">Regístrate</Link></p>
      </div>
    </div>
  );
}