'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

const CLERK_SYNC_SECRET = process.env.NEXT_PUBLIC_CLERK_SYNC_SECRET

export default function SyncPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'syncing' | 'done' | 'error'>('loading')

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn || !user) {
      router.replace('/login')
      return
    }

    const sync = async () => {
      setStatus('syncing')

      const accountType = localStorage.getItem('account_type') || 'client'
      const businessName = localStorage.getItem('business_name') || null

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/clerk-sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-clerk-sync-secret': CLERK_SYNC_SECRET || '',
          },
          body: JSON.stringify({
            clerk_user_id: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            full_name: user.fullName,
            email_verified: user.primaryEmailAddress?.verification?.status === 'verified',
            account_type: accountType,
            business_name: businessName,
          }),
        })

        if (!res.ok) {
          throw new Error(`Sync failed: ${res.status}`)
        }

        localStorage.removeItem('account_type')
        localStorage.removeItem('business_name')

        if (accountType === 'provider') {
          router.replace('/provider-dashboard')
        } else {
          router.replace('/')
        }
      } catch (err) {
        console.error('Sync error:', err)
        setStatus('error')
      }
    }

    sync()
  }, [isLoaded, isSignedIn, user, router])

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error al sincronizar tu cuenta.</p>
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
