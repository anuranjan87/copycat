'use client'

import { SignIn, SignUp } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'

export default function AuthPage() {
  const params = useSearchParams()
  const mode = params.get('mode')

  return (
    <div className="flex min-h-screen items-center justify-center">
      {mode === 'signup' ? (
        <SignUp forceRedirectUrl="/" signInUrl="/sign-in" />
      ) : (
        <SignIn forceRedirectUrl="/" signUpUrl="/sign-in?mode=signup" />
      )}
    </div>
  )
}