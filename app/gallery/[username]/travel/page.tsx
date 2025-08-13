"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { PermissionsProvider } from "@/lib/permissions"
import Navigation from "@/components/navigation"
import { GuestBanner } from "@/components/guest-banner"
import TravelScrapbook from "@/components/travel-scrapbook"
import type { TravelPhoto } from "@/lib/photo-manager"

export default function PublicTravelGalleryPage() {
  const params = useParams()
  const username = params.username as string
  const [photos, setPhotos] = useState<TravelPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [userExists, setUserExists] = useState(true)

  useEffect(() => {
    const loadPhotos = () => {
      // Get user data
      const users = JSON.parse(localStorage.getItem("users") || "[]")
      const user = users.find((u: any) => u.username === username)

      if (!user) {
        setUserExists(false)
        setLoading(false)
        return
      }

      // Get user's travel photos
      const userPhotos = JSON.parse(localStorage.getItem(`gallery-photos-${user.id}`) || "[]")
      const travelPhotos = userPhotos.filter((p: any) => p.category === "travel")

      setPhotos(travelPhotos)
      setLoading(false)
    }

    loadPhotos()
  }, [username])

  if (loading) {
    return (
      <div className="min-h-screen romantic-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading travel photos...</p>
        </div>
      </div>
    )
  }

  if (!userExists) {
    return (
      <div className="min-h-screen romantic-gradient flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-gray-800 mb-4">Gallery Not Found</h1>
          <p className="text-gray-600">The gallery you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <PermissionsProvider galleryOwner={username}>
      <div className="min-h-screen">
        <Navigation />
        <GuestBanner />
        <main className="pt-16">
          <TravelScrapbook initialPhotos={photos} />
        </main>
      </div>
    </PermissionsProvider>
  )
}
