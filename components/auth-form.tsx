"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { SupabaseClient } from "@supabase/supabase-js"

interface AuthFormProps {
  supabase: SupabaseClient
  onSuccess: () => void
}

export default function AuthForm({ supabase, onSuccess }: AuthFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function signInWithEmail() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) {
      if (error.message.includes("Invalid login credentials") || error.message.includes("Email not confirmed")) {
        setError("Incorrect login credentials, ask kez for them.")
      } else {
        setError(error.message)
      }
    } else {
      onSuccess()
    }
    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm shadow-lg rounded-xl p-6 animate-fade-in">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-primary-blue">Welcome to Eurotrip</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-2">
          <Input
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect="off"
            disabled={loading}
          />
        </div>
        <div className="grid gap-2">
          <Input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoCapitalize="none"
            autoComplete="current-password"
            disabled={loading}
          />
        </div>
        <Button
          onClick={signInWithEmail}
          disabled={loading}
          className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white"
        >
          {loading ? "Signing In..." : "Sign In"}
        </Button>
      </CardContent>
    </Card>
  )
}
