"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { PermissionsProvider } from "@/lib/permissions"
import Navigation from "@/components/navigation"
import TimelineSelfieGallery from "@/components/timeline-selfie-gallery"

export default function SelfieGalleryPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log("Selfie gallery page - User:", user, "Loading:", isLoading)

    if (!isLoading && !user) {
      console.log("No user found, redirecting to login")
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen romantic-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your selfie gallery...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen romantic-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <PermissionsProvider galleryOwner={user.username}>
      <main className="min-h-screen">
        <Navigation />
        <div className="pt-16">
          <TimelineSelfieGallery />
        </div>
      </main>
    </PermissionsProvider>
  )
}
