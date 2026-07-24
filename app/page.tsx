'use client'

import { useEffect, useState } from 'react'
import { useUser, SignInButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { usernameChecker } from '@/lib/website-actions'
import {CharacterForm} from '@/components/character-form'

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [showCharacterForm, setShowCharacterForm] = useState(false)

  useEffect(() => {
    if (!isLoaded) return

    // Not signed in
    if (!user) {
      setLoading(false)
      return
    }

    const fetchUsername = async () => {
      try {
        const username = await usernameChecker(user.id)

        if (username) {
          router.replace(`/templates/${username}`)
          return
        }

        // No username -> show the form
        setShowCharacterForm(true)
      } catch (err) {
        console.error(err)
        setShowCharacterForm(true)
      } finally {
        setLoading(false)
      }
    }

    fetchUsername()
  }, [user, isLoaded, router])

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <SignInButton />
      </div>
    )
  }

  if (showCharacterForm) {
    return <CharacterForm />
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      Redirecting...
    </div>
  )
}