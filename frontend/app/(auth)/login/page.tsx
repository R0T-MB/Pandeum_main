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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Pandeum</h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mt-2">Inicia sesión para continuar</p>
        
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" required />
          <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" required />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Ingresar</button>
        </form>
        
        <p className="mt-4 text-center text-sm">¿No tienes cuenta? <Link href="/register" className="text-blue-600">Regístrate</Link></p>
      </div>
    </div>
  );
}