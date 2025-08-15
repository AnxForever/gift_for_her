"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { photoManager, type Photo } from "@/lib/photo-manager"
import { ShareModal } from "@/components/share-modal"
import { Camera, Heart, User, Calendar, Share2, Plus, Eye, TrendingUp, MapPin, Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"

export default function UserDashboard() {
  const { user, supabaseUser } = useAuth() // Use both user and supabaseUser from new auth context
  const [photos, setPhotos] = useState<Photo[]>([])
  const [showShareModal, setShowShareModal] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState({
    avatar: "",
    bio: "",
    location: "",
  })
  const [stats, setStats] = useState({
    total: 0,
    travel: 0,
    selfie: 0,
    festival: 0,
    daily: 0,
  })

  useEffect(() => {
    if (user && supabaseUser) {
      loadPhotos()
      loadProfile()
    }
  }, [user, supabaseUser])

  const loadPhotos = async () => {
    try {
      const allPhotos = await photoManager.getAllPhotos() // Now async
      setPhotos(allPhotos)

      const newStats = {
        total: allPhotos.length,
        travel: allPhotos.filter((p) => p.category === "travel").length,
        selfie: allPhotos.filter((p) => p.category === "selfie").length,
        festival: allPhotos.filter((p) => p.category === "festival").length,
        daily: allPhotos.filter((p) => p.category === "daily").length,
      }
      setStats(newStats)
    } catch (error) {
      console.error("Error loading photos:", error)
    }
  }

  const loadProfile = async () => {
    if (user && supabaseUser) {
      try {
        const { data: profile, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", supabaseUser.id)
          .single()

        if (profile && !error) {
          setProfileData({
            avatar: profile.avatar_url || "",
            bio: profile.bio || "",
            location: profile.location || "",
          })
        }
      } catch (error) {
        console.error("Error loading profile:", error)
      }
    }
  }

  const saveProfile = async () => {
    if (user && supabaseUser) {
      try {
        const { error } = await supabase
          .from("user_profiles")
          .update({
            avatar_url: profileData.avatar,
            bio: profileData.bio,
            location: profileData.location,
          })
          .eq("id", supabaseUser.id)

        if (error) {
          console.error("Error updating profile:", error)
        } else {
          setIsEditingProfile(false)
        }
      } catch (error) {
        console.error("Error saving profile:", error)
      }
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && supabaseUser) {
      try {
        const { url } = await photoManager.uploadPhoto(file, "daily")
        setProfileData((prev) => ({ ...prev, avatar: url }))
      } catch (error) {
        console.error("Error uploading avatar:", error)
      }
    }
  }

  const recentPhotos = photos.slice(-6).reverse()
  const joinDate = user ? new Date(user.createdAt || Date.now()).toLocaleDateString() : ""
  const favoriteCategory =
    stats.travel >= stats.selfie && stats.travel >= stats.festival && stats.travel >= stats.daily
      ? "Travel"
      : stats.selfie >= stats.festival && stats.selfie >= stats.daily
        ? "Selfie"
        : stats.festival >= stats.daily
          ? "Festival"
          : "Daily"

  const galleryCategories = [
    {
      name: "Travel",
      href: "/gallery/travel",
      icon: Camera,
      count: stats.travel,
      color: "from-orange-400 to-pink-400",
      description: "Adventures and journeys",
    },
    {
      name: "Selfie",
      href: "/gallery/selfie",
      icon: User,
      count: stats.selfie,
      color: "from-pink-400 to-purple-400",
      description: "Beautiful self-portraits",
    },
    {
      name: "Festival",
      href: "/gallery/festival",
      icon: Heart,
      count: stats.festival,
      color: "from-purple-400 to-indigo-400",
      description: "Special celebrations",
    },
    {
      name: "Daily",
      href: "/gallery/daily",
      icon: Calendar,
      count: stats.daily,
      color: "from-indigo-400 to-blue-400",
      description: "Everyday moments",
    },
  ]

  if (!user) return null

  return (
    <div className="min-h-screen romantic-gradient safe-area-inset-bottom">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Profile Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="mb-4 sm:mb-6">
            <div className="relative inline-block">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg overflow-hidden">
                {profileData.avatar ? (
                  <img
                    src={profileData.avatar || "/placeholder.svg"}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                )}
              </div>
              <Button
                size="sm"
                className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full glass-pink text-white p-0 touch-manipulation"
                onClick={() => setIsEditingProfile(!isEditingProfile)}
              >
                <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>

            {isEditingProfile ? (
              <div className="max-w-sm sm:max-w-md mx-auto space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Avatar</label>
                  <Input type="file" accept="image/*" onChange={handleAvatarUpload} className="glass-button text-sm" />
                </div>
                <Input
                  placeholder="Bio (e.g., Photography enthusiast)"
                  value={profileData.bio}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, bio: e.target.value }))}
                  className="glass-button text-base"
                />
                <Input
                  placeholder="Location (e.g., Tokyo, Japan)"
                  value={profileData.location}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, location: e.target.value }))}
                  className="glass-button text-base"
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={saveProfile}
                    className="glass-pink text-white touch-manipulation mobile-touch-target"
                  >
                    Save
                  </Button>
                  <Button
                    onClick={() => setIsEditingProfile(false)}
                    variant="outline"
                    className="glass-button touch-manipulation mobile-touch-target"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-gray-800 mb-2 px-2">
                  Welcome back, {user.displayName || user.email}!
                </h1>
                {profileData.bio && <p className="text-gray-600 text-base sm:text-lg mb-2 px-2">{profileData.bio}</p>}
                {profileData.location && (
                  <div className="flex items-center justify-center gap-1 text-gray-500 mb-4">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm sm:text-base">{profileData.location}</span>
                  </div>
                )}
                <p className="text-gray-600 text-sm sm:text-base px-2">Your beautiful photo gallery awaits</p>
              </>
            )}
          </div>

          {!isEditingProfile && (
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4">
              <Button
                onClick={() => setShowShareModal(true)}
                className="glass-pink text-white touch-manipulation mobile-touch-target"
              >
                <Share2 className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-sm sm:text-base">Share Gallery</span>
              </Button>
              <Button
                asChild
                variant="outline"
                className="glass-button bg-transparent touch-manipulation mobile-touch-target"
              >
                <Link href={`/gallery/${user.username}`}>
                  <Eye className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-sm sm:text-base">Preview Public View</span>
                </Link>
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-12">
          <Card className="glass-card">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">{stats.total}</div>
              <div className="text-xs sm:text-sm text-gray-600">Total Photos</div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-base sm:text-lg font-bold text-pink-500 mb-1 truncate">{favoriteCategory}</div>
              <div className="text-xs sm:text-sm text-gray-600">Favorite Category</div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-sm sm:text-lg font-bold text-purple-500 mb-1">{joinDate}</div>
              <div className="text-xs sm:text-sm text-gray-600">Member Since</div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-sm sm:text-lg font-bold text-indigo-500 mb-1">
                {recentPhotos.length > 0 ? "Active" : "Getting Started"}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Status</div>
            </CardContent>
          </Card>
        </div>

        {/* Gallery Categories */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-800 mb-4 sm:mb-6 text-center px-2">
            Your Photo Collections
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {galleryCategories.map((category) => {
              const Icon = category.icon
              return (
                <Link key={category.name} href={category.href}>
                  <Card className="glass-card hover:shadow-xl transition-all duration-300 group cursor-pointer touch-manipulation">
                    <CardContent className="p-4 sm:p-6 text-center">
                      <div
                        className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${category.color} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                      </div>
                      <h3 className="text-base sm:text-lg font-serif font-semibold text-gray-800 mb-1 sm:mb-2">
                        {category.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 leading-relaxed">
                        {category.description}
                      </p>
                      <div className="text-xl sm:text-2xl font-bold text-gray-800">{category.count}</div>
                      <div className="text-xs text-gray-500">photos</div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Recent Photos */}
        {recentPhotos.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center justify-between mb-4 sm:mb-6 px-2">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-800">Recent Uploads</h2>
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500 flex-shrink-0" />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-4">
              {recentPhotos.map((photo) => (
                <div key={photo.id} className="group cursor-pointer touch-manipulation">
                  <div className="aspect-square rounded-lg overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <img
                      src={photo.src || "/placeholder.svg"}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="mt-1 sm:mt-2 text-center">
                    <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">{photo.title}</p>
                    <p className="text-xs text-gray-500 capitalize">{photo.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {stats.total === 0 && (
          <div className="text-center py-12 sm:py-16 px-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Camera className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-serif font-semibold text-gray-800 mb-2">Start Your Photo Journey</h3>
            <p className="text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base leading-relaxed">
              Your gallery is waiting for beautiful moments. Start by adding photos to any of your collections.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              {galleryCategories.slice(0, 2).map((category) => (
                <Button
                  key={category.name}
                  asChild
                  className="glass-pink text-white touch-manipulation mobile-touch-target"
                >
                  <Link href={category.href}>
                    <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Add to {category.name}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} />
    </div>
  )
}
