"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Edit3, Plus, X, Save, BarChart3 } from "lucide-react"
import { photoManager, type SelfiePhoto } from "@/lib/photo-manager"
import { usePermissions } from "@/lib/permissions"
import { useAuth } from "@/lib/auth-context"

export default function TimelineSelfieGallery() {
  const [mounted, setMounted] = useState(false)
  const [selfiePhotos, setSelfiePhotos] = useState<SelfiePhoto[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<string | null>(null)
  const [showStats, setShowStats] = useState(false)
  const [filterMood, setFilterMood] = useState<string>("all")
  const [isUploading, setIsUploading] = useState(false)
  const [editForm, setEditForm] = useState({
    title: "",
    caption: "",
    date: "",
    season: "Spring",
    mood: "joyful",
    location: "",
  })
  const { canEdit } = usePermissions()
  const { supabaseUser } = useAuth()

  useEffect(() => {
    setMounted(true)
    if (canEdit && supabaseUser) {
      loadPhotos()
    }
  }, [canEdit, supabaseUser])

  const loadPhotos = async () => {
    if (!supabaseUser) return

    try {
      const photos = (await photoManager.getPhotosByCategory("selfie")) as SelfiePhoto[]
      setSelfiePhotos(photos)
    } catch (error) {
      console.error("Error loading selfie photos:", error)
    }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit || !supabaseUser) return

    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const { url, storagePath } = await photoManager.uploadPhoto(file, "selfie")

      const newPhoto: Omit<SelfiePhoto, "id" | "userId"> = {
        src: url,
        title: "New Selfie Moment",
        description: "A beautiful selfie moment",
        date: new Date().toISOString().split("T")[0],
        category: "selfie",
        season: "Spring",
        caption: "New selfie moment",
        mood: "joyful",
        location: "",
      }

      await photoManager.addPhoto(newPhoto, storagePath)
      await loadPhotos()
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!canEdit || !supabaseUser) return

    if (confirm("Are you sure you want to delete this photo?")) {
      try {
        await photoManager.deletePhoto(photoId)
        await loadPhotos()
      } catch (error) {
        console.error("Error deleting photo:", error)
      }
    }
  }

  const startEditPhoto = (photo: SelfiePhoto) => {
    setEditingPhoto(photo.id)
    setEditForm({
      title: photo.title,
      caption: photo.caption,
      date: photo.date,
      season: photo.season,
      mood: photo.mood,
      location: photo.location || "",
    })
  }

  const savePhotoEdit = async () => {
    if (!editingPhoto || !supabaseUser) return

    try {
      await photoManager.updatePhoto(editingPhoto, {
        title: editForm.title,
        description: editForm.caption,
        src: "", // Keep existing src
      })
      setEditingPhoto(null)
      await loadPhotos()
    } catch (error) {
      console.error("Error updating photo:", error)
    }
  }

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case "joyful":
        return "😊"
      case "radiant":
        return "✨"
      case "content":
        return "😌"
      case "peaceful":
        return "🕊️"
      case "hopeful":
        return "🌟"
      case "playful":
        return "😄"
      default:
        return "😊"
    }
  }

  const getMoodStats = () => {
    const moodCounts = selfiePhotos.reduce(
      (acc, photo) => {
        acc[photo.mood] = (acc[photo.mood] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(moodCounts).map(([mood, count]) => ({
      mood,
      count,
      percentage: Math.round((count / selfiePhotos.length) * 100),
    }))
  }

  const filteredPhotos = filterMood === "all" ? selfiePhotos : selfiePhotos.filter((photo) => photo.mood === filterMood)

  const createPhotoStrips = () => {
    const strips = []
    for (let i = 0; i < filteredPhotos.length; i += 2) {
      const stripPhotos = filteredPhotos.slice(i, i + 2)
      strips.push({
        id: `strip-${i}`,
        photos: stripPhotos,
        rotation: (Math.random() - 0.5) * 20, // Random rotation between -10 and 10 degrees
        x: Math.random() * 20 - 10, // Random horizontal offset
        y: Math.random() * 20 - 10, // Random vertical offset
      })
    }
    return strips
  }

  const photoStrips = createPhotoStrips()

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 relative">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23d4a574' fillOpacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <div className="relative text-center py-8 px-4">
        <div className="flex justify-center items-center gap-3 mb-4">
          <div className="text-3xl">📸</div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-amber-900">Photo Booth Memories</h1>
          <div className="text-3xl">💕</div>
        </div>
        <p className="font-sans text-lg text-amber-800 max-w-2xl mx-auto mb-6">
          Classic photo booth strips capturing spontaneous moments and genuine smiles
        </p>

        {/* Controls */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <label className="px-4 py-2 bg-green-600 text-white rounded-full font-sans font-medium hover:bg-green-700 transition-colors cursor-pointer shadow-lg border-2 border-green-700">
            <Plus className="w-4 h-4 inline mr-2" />
            {isUploading ? "Uploading..." : "Add Photo"}
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>

          {canEdit && (
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-4 py-2 rounded-full font-sans font-medium transition-all duration-300 shadow-lg border-2 ${
                isEditMode
                  ? "bg-amber-600 text-white border-amber-700 hover:bg-amber-700"
                  : "bg-cream-100 text-amber-700 border-amber-300 hover:bg-amber-100"
              }`}
            >
              <Edit3 className="w-4 h-4 inline mr-2" />
              {isEditMode ? "Done Editing" : "Edit Photos"}
            </button>
          )}

          <button
            onClick={() => setShowStats(!showStats)}
            className="px-4 py-2 bg-orange-600 text-white rounded-full font-sans font-medium hover:bg-orange-700 transition-colors shadow-lg border-2 border-orange-700"
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            {showStats ? "Hide Stats" : "Show Stats"}
          </button>
        </div>

        {/* Mood Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <button
            onClick={() => setFilterMood("all")}
            className={`px-3 py-1 rounded-full text-sm font-sans transition-colors border ${
              filterMood === "all"
                ? "bg-amber-600 text-white border-amber-700"
                : "bg-cream-100 text-amber-700 border-amber-300 hover:bg-amber-100"
            }`}
          >
            All ({selfiePhotos.length})
          </button>
          {["joyful", "radiant", "content", "peaceful", "hopeful", "playful"].map((mood) => {
            const count = selfiePhotos.filter((p) => p.mood === mood).length
            if (count === 0) return null
            return (
              <button
                key={mood}
                onClick={() => setFilterMood(mood)}
                className={`px-3 py-1 rounded-full text-sm font-sans transition-colors capitalize border ${
                  filterMood === mood
                    ? "bg-amber-600 text-white border-amber-700"
                    : "bg-cream-100 text-amber-700 border-amber-300 hover:bg-amber-100"
                }`}
              >
                {mood} ({count})
              </button>
            )
          })}
        </div>

        {/* Stats Panel */}
        {showStats && (
          <div className="max-w-4xl mx-auto mb-8 bg-cream-100/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-2 border-amber-200">
            <h3 className="font-serif text-xl font-semibold mb-4 text-amber-900">Mood Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {getMoodStats().map(({ mood, count, percentage }) => (
                <div key={mood} className="text-center">
                  <div className="text-2xl mb-2">{getMoodIcon(mood)}</div>
                  <div className="font-sans text-sm text-amber-700 capitalize">{mood}</div>
                  <div className="font-sans text-lg font-semibold text-amber-900">{count}</div>
                  <div className="font-sans text-xs text-amber-600">{percentage}%</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12 relative">
        <div className="flex flex-wrap justify-center gap-8">
          {photoStrips.map((strip, stripIndex) => (
            <div
              key={strip.id}
              className="relative group"
              style={{
                transform: `rotate(${strip.rotation}deg) translate(${strip.x}px, ${strip.y}px)`,
                transformOrigin: "center center",
              }}
            >
              <div className="bg-white p-4 shadow-2xl rounded-lg border-4 border-white relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-16 h-6 bg-yellow-200 opacity-80 rounded-sm shadow-md border border-yellow-300 rotate-3"></div>

                <div className="text-center mb-3 border-b-2 border-gray-200 pb-2">
                  <div className="font-mono text-xs text-gray-600 tracking-wider">PHOTO BOOTH</div>
                  <div className="font-mono text-xs text-gray-500">
                    {new Date(strip.photos[0]?.date).toLocaleDateString("en-US", {
                      month: "2-digit",
                      day: "2-digit",
                      year: "2-digit",
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  {strip.photos.map((photo, photoIndex) => (
                    <div key={photo.id} className="relative">
                      <div className="w-48 h-36 bg-gray-100 border-2 border-gray-300 overflow-hidden relative">
                        <img
                          src={photo.src || "/placeholder.svg"}
                          alt={photo.caption}
                          className="w-full h-full object-cover filter sepia-[0.3] contrast-110 brightness-95"
                        />

                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-100/20 via-transparent to-amber-200/20 mix-blend-overlay"></div>

                        {canEdit && isEditMode && (
                          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button
                              onClick={() => startEditPhoto(photo)}
                              className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg text-xs"
                            >
                              <Edit3 className="w-2 h-2" />
                            </button>
                            <button
                              onClick={() => handleDeletePhoto(photo.id)}
                              className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg text-xs"
                            >
                              <X className="w-2 h-2" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="mt-1 text-center">
                        <div className="font-mono text-xs text-gray-600 italic transform -rotate-1">
                          {photo.caption}
                        </div>
                        <div className="font-mono text-xs text-gray-500 flex items-center justify-center gap-1 mt-1">
                          <span>{getMoodIcon(photo.mood)}</span>
                          <span className="capitalize">{photo.mood}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center mt-3 pt-2 border-t-2 border-gray-200">
                  <div className="font-mono text-xs text-gray-500 tracking-wider">MEMORIES</div>
                </div>
              </div>

              <div className="absolute -bottom-2 right-4 w-12 h-5 bg-yellow-200 opacity-70 rounded-sm shadow-md border border-yellow-300 -rotate-12"></div>
            </div>
          ))}
        </div>

        {filteredPhotos.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📸</div>
            <p className="font-sans text-amber-700 text-lg">No photo booth memories found for the selected mood</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingPhoto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-xl font-semibold mb-4">Edit Photo</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full p-3 border rounded-lg font-sans"
                placeholder="Title"
              />
              <input
                type="text"
                value={editForm.caption}
                onChange={(e) => setEditForm({ ...editForm, caption: e.target.value })}
                className="w-full p-3 border rounded-lg font-sans"
                placeholder="Caption"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  className="p-3 border rounded-lg font-sans text-sm"
                />
                <select
                  value={editForm.season}
                  onChange={(e) => setEditForm({ ...editForm, season: e.target.value })}
                  className="p-3 border rounded-lg font-sans text-sm"
                >
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                  <option value="Autumn">Autumn</option>
                  <option value="Winter">Winter</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={editForm.mood}
                  onChange={(e) => setEditForm({ ...editForm, mood: e.target.value })}
                  className="p-3 border rounded-lg font-sans text-sm"
                >
                  <option value="joyful">Joyful</option>
                  <option value="radiant">Radiant</option>
                  <option value="content">Content</option>
                  <option value="peaceful">Peaceful</option>
                  <option value="hopeful">Hopeful</option>
                  <option value="playful">Playful</option>
                </select>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="p-3 border rounded-lg font-sans text-sm"
                  placeholder="Location"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={savePhotoEdit}
                  className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-sans font-medium"
                >
                  <Save className="w-4 h-4 inline mr-2" />
                  Save
                </button>
                <button
                  onClick={() => setEditingPhoto(null)}
                  className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-sans font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
