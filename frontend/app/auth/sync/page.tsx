'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

const CLERK_SYNC_SECRET = process.env.NEXT_PUBLIC_CLERK_SYNC_SECRET
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type SyncError = { message: string; detail?: string; status?: number }

export default function SyncPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'syncing' | 'done' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<SyncError | null>(null)

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn || !user) {
      router.replace('/login')
      return
    }

    if (!CLERK_SYNC_SECRET) {
      setErrorMessage({ message: 'Falta configurar NEXT_PUBLIC_CLERK_SYNC_SECRET' })
      setStatus('error')
      return
    }

    if (!user.primaryEmailAddress?.emailAddress) {
      setErrorMessage({ message: 'No se pudo obtener el correo de Clerk' })
      setStatus('error')
      return
    }

    const sync = async () => {
      setStatus('syncing')

      const accountType = localStorage.getItem('account_type') || 'client'
      const businessName = localStorage.getItem('business_name') || null

      try {
        const res = await fetch(`${API_URL}/auth/clerk-sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-clerk-sync-secret': CLERK_SYNC_SECRET,
          },
          body: JSON.stringify({
            clerk_user_id: user.id,
            email: user.primaryEmailAddress.emailAddress,
            full_name: user.fullName,
            email_verified: user.primaryEmailAddress.verification?.status === 'verified',
            account_type: accountType,
            business_name: businessName,
          }),
        })

        if (!res.ok) {
          const body = await res.text()
          let detail: string | undefined
          try { const json = JSON.parse(body); detail = json.detail } catch { detail = body || undefined }
          console.error('Sync failed:', { status: res.status, body: detail || body })
          throw { message: `Sync failed: ${res.status}`, detail, status: res.status }
        }

        localStorage.removeItem('account_type')
        localStorage.removeItem('business_name')

        if (accountType === 'provider') {
          router.replace('/provider-dashboard')
        } else {
          router.replace('/')
        }
      } catch (err: any) {
        console.error('Sync error:', err)
        setErrorMessage(err?.message ? { message: err.message, detail: err.detail, status: err.status } : { message: err?.toString() || 'Error desconocido' })
        setStatus('error')
      }
    }

    sync()
  }, [isLoaded, isSignedIn, user, router])

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
        <div className="text-center max-w-md px-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-xl font-bold">!</span>
          </div>
          <p className="text-red-400 mb-2 font-medium">Error al sincronizar tu cuenta.</p>
          {errorMessage?.status && (
            <p className="text-sm text-slate-400 mb-1">Código: {errorMessage.status}</p>
          )}
          {errorMessage?.detail && (
            <p className="text-xs text-slate-500 bg-[#151E2F] rounded-xl px-4 py-2 border border-[#1E2D4A] mb-4 break-words">
              {errorMessage.detail}
            </p>
          )}
          {!errorMessage?.status && !errorMessage?.detail && errorMessage && (
            <p className="text-xs text-slate-500 bg-[#151E2F] rounded-xl px-4 py-2 border border-[#1E2D4A] mb-4 break-words">
              {errorMessage.message}
            </p>
          )}
          <button
            onClick={() => window.location.reload()}
            className="bg-[#1E3A5F] hover:bg-[#2F5D7C] text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#2F5D7C] mx-auto mb-4" />
        <p className="text-slate-400">
          {status === 'syncing' ? 'Sincronizando tu cuenta...' : 'Cargando...'}
        </p>
      </div>
    </div>
  )
}
