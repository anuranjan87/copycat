'use client'

import { useEffect, useState } from 'react'
import { useUser, SignInButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { usernameChecker } from '@/lib/website-actions'

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  const [loading, setLoading] = useState(true)

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

        // Fallback if no username exists
        router.replace('/templates/demo')
      } catch (err) {
        console.error(err)
        router.replace('/templates/demo')
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

  return (
    <div className="flex min-h-screen items-center justify-center">
Redirecting...    </div>
  )
}