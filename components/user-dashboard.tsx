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

export default function UserDashboard() {
  const { user } = useAuth()
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
    if (user) {
      loadPhotos()
      loadProfile()
    }
  }, [user])

  const loadPhotos = () => {
    const allPhotos = photoManager.getAllPhotos()
    setPhotos(allPhotos)

    const newStats = {
      total: allPhotos.length,
      travel: allPhotos.filter((p) => p.category === "travel").length,
      selfie: allPhotos.filter((p) => p.category === "selfie").length,
      festival: allPhotos.filter((p) => p.category === "festival").length,
      daily: allPhotos.filter((p) => p.category === "daily").length,
    }
    setStats(newStats)
  }

  const loadProfile = () => {
    if (user) {
      const savedProfile = localStorage.getItem(`profile_${user.id}`)
      if (savedProfile) {
        setProfileData(JSON.parse(savedProfile))
      }
    }
  }

  const saveProfile = () => {
    if (user) {
      localStorage.setItem(`profile_${user.id}`, JSON.stringify(profileData))
      setIsEditingProfile(false)
    }
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileData((prev) => ({ ...prev, avatar: e.target?.result as string }))
      }
      reader.readAsDataURL(file)
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
    <div className="min-h-screen romantic-gradient">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden">
                {profileData.avatar ? (
                  <img
                    src={profileData.avatar || "/placeholder.svg"}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full glass-pink text-white p-0"
                onClick={() => setIsEditingProfile(!isEditingProfile)}
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            </div>

            {isEditingProfile ? (
              <div className="max-w-md mx-auto space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Avatar</label>
                  <Input type="file" accept="image/*" onChange={handleAvatarUpload} className="glass-button" />
                </div>
                <Input
                  placeholder="Bio (e.g., Photography enthusiast)"
                  value={profileData.bio}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, bio: e.target.value }))}
                  className="glass-button"
                />
                <Input
                  placeholder="Location (e.g., Tokyo, Japan)"
                  value={profileData.location}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, location: e.target.value }))}
                  className="glass-button"
                />
                <div className="flex gap-2">
                  <Button onClick={saveProfile} className="glass-pink text-white">
                    Save
                  </Button>
                  <Button onClick={() => setIsEditingProfile(false)} variant="outline" className="glass-button">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-4xl font-serif font-bold text-gray-800 mb-2">Welcome back, {user.displayName}!</h1>
                {profileData.bio && <p className="text-gray-600 text-lg mb-2">{profileData.bio}</p>}
                {profileData.location && (
                  <div className="flex items-center justify-center gap-1 text-gray-500 mb-4">
                    <MapPin className="w-4 h-4" />
                    <span>{profileData.location}</span>
                  </div>
                )}
                <p className="text-gray-600">Your beautiful photo gallery awaits</p>
              </>
            )}
          </div>

          {!isEditingProfile && (
            <div className="flex justify-center gap-4">
              <Button onClick={() => setShowShareModal(true)} className="glass-pink text-white">
                <Share2 className="w-4 h-4 mr-2" />
                Share Gallery
              </Button>
              <Button asChild variant="outline" className="glass-button bg-transparent">
                <Link href={`/gallery/${user.username}`}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Public View
                </Link>
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-800 mb-1">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Photos</div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <div className="text-lg font-bold text-pink-500 mb-1">{favoriteCategory}</div>
              <div className="text-sm text-gray-600">Favorite Category</div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <div className="text-lg font-bold text-purple-500 mb-1">{joinDate}</div>
              <div className="text-sm text-gray-600">Member Since</div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <div className="text-lg font-bold text-indigo-500 mb-1">
                {recentPhotos.length > 0 ? "Active" : "Getting Started"}
              </div>
              <div className="text-sm text-gray-600">Status</div>
            </CardContent>
          </Card>
        </div>

        {/* Gallery Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-serif font-bold text-gray-800 mb-6 text-center">Your Photo Collections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {galleryCategories.map((category) => {
              const Icon = category.icon
              return (
                <Link key={category.name} href={category.href}>
                  <Card className="glass-card hover:shadow-xl transition-all duration-300 group cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <div
                        className={`w-16 h-16 bg-gradient-to-br ${category.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-serif font-semibold text-gray-800 mb-2">{category.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                      <div className="text-2xl font-bold text-gray-800">{category.count}</div>
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
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-bold text-gray-800">Recent Uploads</h2>
              <TrendingUp className="w-6 h-6 text-pink-500" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {recentPhotos.map((photo) => (
                <div key={photo.id} className="group cursor-pointer">
                  <div className="aspect-square rounded-lg overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <img
                      src={photo.src || "/placeholder.svg"}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm font-medium text-gray-800 truncate">{photo.title}</p>
                    <p className="text-xs text-gray-500 capitalize">{photo.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {stats.total === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Camera className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-serif font-semibold text-gray-800 mb-2">Start Your Photo Journey</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Your gallery is waiting for beautiful moments. Start by adding photos to any of your collections.
            </p>
            <div className="flex justify-center gap-4">
              {galleryCategories.slice(0, 2).map((category) => (
                <Button key={category.name} asChild className="glass-pink text-white">
                  <Link href={category.href}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add to {category.name}
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
