"use client"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { signUp } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Mail, Lock, User, Sparkles, Loader2 } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className={`w-full font-semibold transition-all duration-300 ${
        pending ? "glass-pink-disabled" : "glass-pink hover:scale-105"
      }`}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating Account...
        </>
      ) : (
        "Create Account"
      )}
    </Button>
  )
}

export default function RegisterPage() {
  const [state, formAction] = useActionState(signUp, null)

  return (
    <div className="min-h-screen romantic-gradient flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <Heart
            key={i}
            className="absolute text-pink-300/20 floating-animation"
            size={Math.random() * 20 + 10}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <Card className="w-full max-w-md glass-card">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Sparkles className="text-pink-500" size={48} />
          </div>
          <CardTitle className="text-2xl font-serif text-gray-800">Create Your Gallery</CardTitle>
          <CardDescription className="text-gray-600">Start your beautiful photo journey</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {state?.error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-700 px-4 py-3 rounded">{state.error}</div>
            )}

            {state?.success && (
              <div className="bg-green-500/10 border border-green-500/50 text-green-700 px-4 py-3 rounded">
                {state.success}
              </div>
            )}

            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                <Input name="username" type="text" placeholder="Username" className="pl-10 glass-button" required />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Sparkles className="absolute left-3 top-3 text-gray-400" size={18} />
                <Input
                  name="displayName"
                  type="text"
                  placeholder="Display Name"
                  className="pl-10 glass-button"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                <Input name="email" type="email" placeholder="Email" className="pl-10 glass-button" required />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <Input
                  name="password"
                  type="password"
                  placeholder="Password (min 6 characters)"
                  className="pl-10 glass-button"
                  required
                />
              </div>
            </div>

            <SubmitButton />
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-pink-500 hover:text-pink-600 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
