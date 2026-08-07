'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSignIn } from '@clerk/nextjs'
import { Loader2, Mail, Lock, KeyRound, ArrowLeft, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const router = useRouter()

  const [step, setStep] = useState<'email' | 'code' | 'password' | 'done'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  const startResendTimer = () => {
    setResendCooldown(30)
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signIn) return
    setLoading(true)
    setError(null)
    try {
      const si = await signIn.create({ identifier: email })
      const resetFactor = si.supportedFirstFactors?.find(
        (f: any) => f.strategy === 'reset_password_email_code'
      ) as { emailAddressId: string } | undefined
      if (!resetFactor?.emailAddressId) {
        throw new Error('No se pudo iniciar la recuperación. Verifica tu email o inténtalo más tarde.')
      }
      await signIn.prepareFirstFactor({
        strategy: 'reset_password_email_code',
        emailAddressId: resetFactor.emailAddressId,
      })
      startResendTimer()
      setStep('code')
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage ?? 'No se pudo enviar el código. Verifica tu email o intenta más tarde.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signIn) return
    setLoading(true)
    setError(null)
    try {
      await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
      })
      setStep('password')
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage ?? 'El código no es válido o ha expirado.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signIn) return
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await signIn.resetPassword({ password })
      if (result.status === 'complete') {
        if (setActive) {
          await setActive({ session: result.createdSessionId })
        }
        setStep('done')
      } else {
        throw new Error('No se pudo restablecer la contraseña. Intenta de nuevo.')
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage ?? 'No se pudo restablecer la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  const goBackToLogin = () => {
    router.push('/login')
  }

  const inputClass =
    'w-full px-4 py-3 rounded-xl bg-[#0F172A] border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2F5D7C] transition-all'

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-100">Recuperar contraseña</h1>
          <p className="text-slate-400 mt-2">
            {step === 'email' && 'Te enviaremos un código a tu email para restablecer tu contraseña.'}
            {step === 'code' && 'Revisa tu bandeja de entrada y escribe el código de verificación.'}
            {step === 'password' && 'Elige una nueva contraseña para tu cuenta.'}
            {step === 'done' && '¡Contraseña actualizada con éxito!'}
          </p>
        </div>

        <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-8 shadow-xl">
          {step === 'email' && (
            <form onSubmit={handleSendCode} className="space-y-5">
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className={`${inputClass} pl-11`}
                />
              </div>
              {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1E3A5F] hover:bg-[#2F5D7C] text-white font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                {loading ? 'Enviando...' : 'Enviar código'}
              </button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div className="relative">
                <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="000000"
                  className={`${inputClass} pl-11`}
                />
              </div>
              {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1E3A5F] hover:bg-[#2F5D7C] text-white font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                {loading ? 'Verificando...' : 'Verificar código'}
              </button>
              <button
                type="button"
                disabled={loading || resendCooldown > 0}
                onClick={handleSendCode}
                className="w-full text-sm text-[#2F5D7C] hover:text-[#3A7DA0] disabled:opacity-50 transition-colors"
              >
                {resendCooldown > 0 ? `Reenviar código en ${resendCooldown}s` : 'Reenviar código'}
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nueva contraseña (mín. 8 caracteres)"
                  className={`${inputClass} pl-11`}
                />
              </div>
              {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1E3A5F] hover:bg-[#2F5D7C] text-white font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                {loading ? 'Guardando...' : 'Actualizar contraseña'}
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
                <ShieldCheck size={32} className="text-emerald-400" />
              </div>
              <p className="text-slate-300">Tu contraseña se restableció correctamente. Ya puedes iniciar sesión con tu nueva contraseña.</p>
              <button
                onClick={goBackToLogin}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1E3A5F] hover:bg-[#2F5D7C] text-white font-semibold transition-colors"
              >
                <ArrowLeft size={16} />
                Ir a iniciar sesión
              </button>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">
            <ArrowLeft size={14} />
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
