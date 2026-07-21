'use client'

import { useState } from 'react'
import { SignUp } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { useRouter } from 'next/navigation'

type AccountType = 'client' | 'provider' | null

export default function RegisterPage() {
  const [step, setStep] = useState<'select' | 'business_name' | 'signup'>('select')
  const [accountType, setAccountType] = useState<AccountType>(null)
  const [businessName, setBusinessName] = useState('')
  const router = useRouter()

  const handleSelectType = (type: 'client' | 'provider') => {
    setAccountType(type)
    if (type === 'provider') {
      setStep('business_name')
    } else {
      localStorage.setItem('account_type', 'client')
      setStep('signup')
    }
  }

  const handleBusinessNameNext = () => {
    if (!businessName.trim()) return
    localStorage.setItem('account_type', 'provider')
    localStorage.setItem('business_name', businessName.trim())
    setStep('signup')
  }

  if (step === 'select') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
        <div className="w-full max-w-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-100">Crear cuenta</h1>
            <p className="text-slate-400 mt-2">Elige cómo quieres usar Pandeum.</p>
          </div>
          <div className="space-y-4">
            <button
              onClick={() => handleSelectType('client')}
              className="w-full p-6 rounded-xl border border-slate-700 bg-[#1E293B] hover:bg-[#2A3A4F] hover:border-[#2F5D7C] transition-all text-left group"
            >
              <h3 className="text-lg font-semibold text-slate-100 group-hover:text-[#2F5D7C] transition-colors">Cliente</h3>
              <p className="text-slate-400 mt-1 text-sm">Quiero encontrar soluciones, negocios y servicios cerca de mí.</p>
            </button>
            <button
              onClick={() => handleSelectType('provider')}
              className="w-full p-6 rounded-xl border border-slate-700 bg-[#1E293B] hover:bg-[#2A3A4F] hover:border-[#2F5D7C] transition-all text-left group"
            >
              <h3 className="text-lg font-semibold text-slate-100 group-hover:text-[#2F5D7C] transition-colors">Proveedor / negocio</h3>
              <p className="text-slate-400 mt-1 text-sm">Quiero registrar mi negocio o servicio en Pandeum.</p>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'business_name') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
        <div className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-100">Nombre del negocio</h1>
            <p className="text-slate-400 mt-2">¿Cuál es el nombre de tu negocio o servicio?</p>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Nombre del negocio"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBusinessNameNext()}
              className="w-full px-4 py-2.5 border border-slate-600 rounded-lg bg-[#0F172A] text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]/20 transition-shadow"
            />
            <button
              onClick={handleBusinessNameNext}
              disabled={!businessName.trim()}
              className="w-full bg-[#1E3A5F] hover:bg-[#2F5D7C] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              Continuar
            </button>
            <button
              onClick={() => setStep('select')}
              className="w-full text-center text-sm text-slate-400 hover:text-slate-300 transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-100">Crear cuenta</h1>
          <p className="text-slate-400 mt-2">Completa tu registro en Pandeum.</p>
        </div>
        <SignUp
          routing="path"
          path="/register"
          signInUrl="/login"
          afterSignUpUrl="/auth/sync"
          afterSignInUrl="/auth/sync"
          appearance={{
            baseTheme: dark,
            elements: {
              rootBox: "w-full",
              card: "bg-[#1E293B] shadow-none border border-slate-700 w-full",
              headerTitle: "text-slate-100",
              headerSubtitle: "text-slate-400",
              formButtonPrimary: "bg-[#1E3A5F] hover:bg-[#2F5D7C] text-white",
              formFieldInput: "bg-[#0F172A] border-slate-600 text-slate-100",
              formFieldLabel: "text-slate-300",
              footerActionLink: "text-[#2F5D7C] hover:text-[#3A7DA0]",
              socialButtonsBlockButton: "bg-[#0F172A] border-slate-600 text-slate-100 hover:bg-[#1E293B]",
              socialButtonsBlockButtonText: "text-slate-100",
              dividerLine: "bg-slate-700",
              dividerText: "text-slate-400",
            },
          }}
        />
      </div>
    </div>
  )
}
