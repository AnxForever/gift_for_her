"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { PermissionsProvider } from "@/lib/permissions"
import Navigation from "@/components/navigation"
import UserDashboard from "@/components/user-dashboard"

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen romantic-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <PermissionsProvider>
      <main className="min-h-screen">
        <Navigation />
        <div className="pt-16">
          <UserDashboard />
        </div>
      </main>
    </PermissionsProvider>
  )
}
