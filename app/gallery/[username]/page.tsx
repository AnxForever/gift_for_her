"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { PermissionsProvider } from "@/lib/permissions"
import Navigation from "@/components/navigation"
import { GuestBanner } from "@/components/guest-banner"
import { supabase } from "@/lib/supabase" // Import Supabase client
import { photoManager } from "@/lib/photo-manager" // Import PhotoManager for photo queries
import Link from "next/link"
import { Camera, Heart, User, Calendar } from "lucide-react"

interface UserGallery {
  username: string
  displayName: string
  photoCount: number
  categories: {
    travel: number
    selfie: number
    festival: number
    daily: number
  }
}

export default function PublicGalleryPage() {
  const params = useParams()
  const username = params.username as string
  const [gallery, setGallery] = useState<UserGallery | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadGallery = async () => {
      // Make function async for database queries
      console.log("Loading gallery for username:", username)

      try {
        const { data: user, error: userError } = await supabase
          .from("users")
          .select("id, username, display_name")
          .eq("username", username)
          .single()

        console.log("Found user:", user)

        if (userError || !user) {
          console.log("User not found for username:", username, userError)
          setLoading(false)
          return
        }

        const userPhotos = await photoManager.getPhotosByUser(username)
        console.log("User photos:", userPhotos.length)

        const categories = {
          travel: userPhotos.filter((p) => p.category === "travel").length,
          selfie: userPhotos.filter((p) => p.category === "selfie").length,
          festival: userPhotos.filter((p) => p.category === "festival").length,
          daily: userPhotos.filter((p) => p.category === "daily").length,
        }

        setGallery({
          username: user.username,
          displayName: user.display_name,
          photoCount: userPhotos.length,
          categories,
        })
        setLoading(false)
      } catch (error) {
        console.error("Error loading gallery:", error)
        setLoading(false)
      }
    }

    loadGallery()
  }, [username])

  if (loading) {
    return (
      <div className="min-h-screen romantic-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading gallery...</p>
        </div>
      </div>
    )
  }

  if (!gallery) {
    return (
      <div className="min-h-screen romantic-gradient flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-gray-800 mb-4">Gallery Not Found</h1>
          <p className="text-gray-600 mb-4">The gallery you're looking for doesn't exist.</p>
          <div className="text-sm text-gray-500 bg-white/50 p-4 rounded-lg max-w-md mx-auto">
            <p>
              Looking for user: <strong>{username}</strong>
            </p>
            <p>This user may not have created a gallery yet.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <PermissionsProvider galleryOwner={username}>
      <div className="min-h-screen">
        <Navigation />
        <GuestBanner />

        <main className="pt-16 romantic-gradient min-h-screen">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-serif text-gray-800 mb-4">{gallery.displayName}'s Photo Gallery</h1>
              <p className="text-gray-600 text-lg">A beautiful collection of {gallery.photoCount} precious moments</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {gallery.categories.travel > 0 && (
                <Link
                  href={`/gallery/${username}/travel`}
                  className="glass-card p-6 rounded-2xl hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="text-center">
                    <Camera className="w-12 h-12 text-pink-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-serif text-gray-800 mb-2">Travel</h3>
                    <p className="text-gray-600">{gallery.categories.travel} photos</p>
                  </div>
                </Link>
              )}

              {gallery.categories.selfie > 0 && (
                <Link
                  href={`/gallery/${username}/selfie`}
                  className="glass-card p-6 rounded-2xl hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="text-center">
                    <User className="w-12 h-12 text-pink-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-serif text-gray-800 mb-2">Selfie</h3>
                    <p className="text-gray-600">{gallery.categories.selfie} photos</p>
                  </div>
                </Link>
              )}

              {gallery.categories.festival > 0 && (
                <Link
                  href={`/gallery/${username}/festival`}
                  className="glass-card p-6 rounded-2xl hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="text-center">
                    <Heart className="w-12 h-12 text-pink-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-serif text-gray-800 mb-2">Festival</h3>
                    <p className="text-gray-600">{gallery.categories.festival} photos</p>
                  </div>
                </Link>
              )}

              {gallery.categories.daily > 0 && (
                <Link
                  href={`/gallery/${username}/daily`}
                  className="glass-card p-6 rounded-2xl hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="text-center">
                    <Calendar className="w-12 h-12 text-pink-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-serif text-gray-800 mb-2">Daily</h3>
                    <p className="text-gray-600">{gallery.categories.daily} photos</p>
                  </div>
                </Link>
              )}
            </div>

            {gallery.photoCount === 0 && (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-pink-300 mx-auto mb-4" />
                <h3 className="text-xl font-serif text-gray-600 mb-2">No Photos Yet</h3>
                <p className="text-gray-500">This gallery is waiting for beautiful moments to be shared.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </PermissionsProvider>
  )
}
