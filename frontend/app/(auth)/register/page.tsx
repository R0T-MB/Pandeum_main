'use client';
import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const { register } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({ email, password, full_name: fullName, city });
      window.location.href = '/';
    } catch (error) {
      alert('Error al registrarse');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0F172A]">
      <div className="bg-white dark:bg-[#1E293B] p-8 rounded-xl border border-slate-200 dark:border-slate-700 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-slate-900 dark:text-slate-100">Registro</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input type="text" placeholder="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]/20 transition-shadow" />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]/20 transition-shadow" required />
          <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]/20 transition-shadow" required />
          <input type="text" placeholder="Ciudad" value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]/20 transition-shadow" />
          <button type="submit" className="w-full bg-[#1E3A5F] hover:bg-[#2F5D7C] text-white font-medium py-2.5 rounded-lg transition-colors">Registrarse</button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">¿Ya tienes cuenta? <Link href="/login" className="text-[#1E3A5F] dark:text-[#2F5D7C] font-medium hover:underline">Inicia sesión</Link></p>
      </div>
    </div>
  );
}