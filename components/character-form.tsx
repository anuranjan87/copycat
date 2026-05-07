"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert"

import {
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

import { storeCharacter } from "@/lib/actions"

export function CharacterForm() {
  const router = useRouter()
  const { user } = useUser()

  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setMessage({
        type: "error",
        text: "Please enter a name",
      })
      return
    }

    if (name.length > 10) {
      setMessage({
        type: "error",
        text: "Maximum 10 characters allowed",
      })
      return
    }

    if (!user) {
      setMessage({
        type: "error",
        text: "Please sign in first",
      })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const result = await storeCharacter(
        name.toLowerCase(),
        user.id
      )

      if (result.success) {
        setMessage({
          type: "success",
          text: "Link created successfully",
        })

        setTimeout(() => {
          router.push(`/templates/${name.toLowerCase()}`)
        }, 1200)
      } else {
        setMessage({
          type: "error",
          text: result.error || "Something went wrong",
        })
      }
    } catch (error) {
      console.error(error)

      setMessage({
        type: "error",
        text: "Unexpected error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4">

      {/* background glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-in fade-in zoom-in duration-300">

        {/* close */}
        <button
          onClick={() => router.back()}
          className="absolute -right-3 -top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-zinc-900 text-white/70 transition hover:scale-105 hover:text-white"
        >
          ✕
        </button>

        <Card className="relative overflow-hidden border border-zinc-800/70 bg-zinc-950/95 shadow-2xl backdrop-blur-2xl">

          {/* gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_60%)]" />

          <CardHeader className="relative text-center pb-2">

            <div className="mb-5 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <span className="text-xl text-white">
                  ✦
                </span>
              </div>
            </div>

            <CardTitle className="text-3xl font-light tracking-tight text-white">
              Claim your link
            </CardTitle>

            <CardDescription className="mt-2 text-sm font-light leading-relaxed text-zinc-400">
              This becomes your public 7Wings URL.
            </CardDescription>

          </CardHeader>

          <CardContent className="relative px-8 pb-8 pt-4">

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              <div className="space-y-3">

                <Label
                  htmlFor="name"
                  className="text-xs uppercase tracking-[0.2em] text-zinc-500"
                >
                  Your link
                </Label>

                <div className="relative">

                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                    7wings.com/
                  </div>

                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="yourname"
                    maxLength={10}
                    disabled={isLoading}
                    className="h-14 rounded-2xl border-zinc-700/50 bg-zinc-900/70 pl-[120px] text-lg text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:bg-zinc-900"
                  />

                </div>

                <p className="text-xs text-zinc-500">
                  Maximum 10 characters
                </p>

              </div>

              {message && (
                <Alert
                  variant={
                    message.type === "error"
                      ? "destructive"
                      : "default"
                  }
                  className={`rounded-2xl border ${
                    message.type === "error"
                      ? "border-red-800/50 bg-red-950/40 text-red-200"
                      : "border-green-800/50 bg-green-950/40 text-green-200"
                  }`}
                >

                  {message.type === "success" ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-400" />
                  )}

                  <AlertDescription className="font-light">
                    {message.text}
                  </AlertDescription>

                </Alert>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="h-14 w-full rounded-2xl bg-white text-base font-medium text-black transition-all duration-300 hover:scale-[1.02] hover:bg-zinc-200"
              >

                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Continue"
                )}

              </Button>

            </form>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}