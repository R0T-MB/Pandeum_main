'use client'

import { SignIn } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-100">Iniciar sesión</h1>
          <p className="text-slate-400 mt-2">Accede a tu cuenta de Pandeum.</p>
        </div>
        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/register"
          afterSignInUrl="/auth/sync"
          appearance={{
            baseTheme: dark,
            elements: {
              rootBox: "w-full",
              card: "bg-[#1E293B] shadow-none border border-slate-700 w-full",
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
