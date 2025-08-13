"use client"

import { usePermissions } from "@/lib/permissions"
import { Eye, Heart } from "lucide-react"

export function GuestBanner() {
  const { isGuest, galleryOwner } = usePermissions()

  if (!isGuest || !galleryOwner) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-pink-100 to-purple-100 border-b border-pink-200 py-3">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center space-x-2 text-gray-700">
          <Eye className="w-4 h-4 text-pink-500" />
          <span className="text-sm font-medium">
            You're viewing <span className="font-semibold text-pink-600">{galleryOwner}'s</span> photo gallery
          </span>
          <Heart className="w-4 h-4 text-pink-500" />
        </div>
      </div>
    </div>
  )
}
