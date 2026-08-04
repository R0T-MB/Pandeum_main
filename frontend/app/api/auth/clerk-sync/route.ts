import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function POST(request: Request) {
  const { userId } = auth()

  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const syncSecret = process.env.CLERK_SYNC_SECRET
  if (!syncSecret) {
    return NextResponse.json({ error: 'CLERK_SYNC_SECRET no configurado' }, { status: 500 })
  }

  let accountType = 'client'
  let businessName: string | null = null
  try {
    const body = await request.json()
    accountType = body.account_type === 'provider' ? 'provider' : 'client'
    businessName = typeof body.business_name === 'string' ? body.business_name : null
  } catch {}

  let clerkUser
  try {
    clerkUser = await clerkClient.users.getUser(userId)
  } catch {
    return NextResponse.json({ error: 'No se pudo obtener el usuario de Clerk' }, { status: 500 })
  }

  const email = clerkUser.primaryEmailAddress?.emailAddress
  if (!email) {
    return NextResponse.json({ error: 'No se pudo obtener el correo de Clerk' }, { status: 400 })
  }

  const fullName = `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() || null
  const emailVerified = clerkUser.primaryEmailAddress?.verification?.status === 'verified'

  const res = await fetch(`${API_URL}/auth/clerk-sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-clerk-sync-secret': syncSecret,
    },
    body: JSON.stringify({
      clerk_user_id: userId,
      email,
      full_name: fullName,
      email_verified: emailVerified,
      account_type: accountType,
      business_name: businessName,
    }),
  })

  if (!res.ok) {
    const detail = await res.text()
    console.error('clerk-sync upstream failed:', res.status, detail)
    return NextResponse.json({ error: `Sync falló: ${res.status}`, detail }, { status: res.status })
  }

  const user = await res.json()
  return NextResponse.json({ ok: true, user })
}
