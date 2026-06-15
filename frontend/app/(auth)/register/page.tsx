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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center">Registro</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input type="text" placeholder="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
          <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
          <input type="text" placeholder="Ciudad" value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg">Registrarse</button>
        </form>
        <p className="mt-4 text-center">¿Ya tienes cuenta? <Link href="/login" className="text-blue-600">Inicia sesión</Link></p>
      </div>
    </div>
  );
}