import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pandeum - Soluciones Inteligentes',
  description: 'Las personas no buscan productos ni servicios. Buscan soluciones.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ClerkProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <AuthProvider>
              {children}
              <Toaster position="top-right" />
            </AuthProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}