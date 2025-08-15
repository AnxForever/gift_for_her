"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { PermissionsProvider } from "@/lib/permissions"
import Navigation from "@/components/navigation"
import { GuestBanner } from "@/components/guest-banner"
import TravelScrapbook from "@/components/travel-scrapbook"
import { photoManager } from "@/lib/photo-manager" // Import PhotoManager for database queries
import { supabase } from "@/lib/supabase" // Import Supabase client
import type { TravelPhoto } from "@/lib/photo-manager"

export default function PublicTravelGalleryPage() {
  const params = useParams()
  const username = params.username as string
  const [photos, setPhotos] = useState<TravelPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [userExists, setUserExists] = useState(true)

  useEffect(() => {
    const loadPhotos = async () => {
      // Make function async for database queries
      try {
        const { data: user, error: userError } = await supabase
          .from("users")
          .select("id, username")
          .eq("username", username)
          .single()

        if (userError || !user) {
          setUserExists(false)
          setLoading(false)
          return
        }

        const allPhotos = await photoManager.getPhotosByUser(username)
        const travelPhotos = allPhotos.filter((p) => p.category === "travel") as TravelPhoto[]

        setPhotos(travelPhotos)
        setLoading(false)
      } catch (error) {
        console.error("Error loading travel photos:", error)
        setUserExists(false)
        setLoading(false)
      }
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
