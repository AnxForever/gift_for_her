"use client"
import EnhancedPhotoUpload from "@/components/enhanced-photo-upload"
import { useState, useEffect } from "react"
import { MapPin, Plane, Camera, Heart, Star, Edit, Trash2, Save, X } from "lucide-react"
import { photoManager, type TravelPhoto } from "@/lib/photo-manager"
import { usePermissions } from "@/lib/permissions"
import { useAuth } from "@/lib/auth-context"
import { EditButton } from "@/components/edit-button"
import OptimizedImage from "@/components/optimized-image"

interface TravelScrapbookProps {
  initialPhotos?: TravelPhoto[]
}

export default function TravelScrapbook({ initialPhotos }: TravelScrapbookProps) {
  const [photos, setPhotos] = useState<TravelPhoto[]>(initialPhotos || [])
  const [hoveredPhoto, setHoveredPhoto] = useState<string | null>(null) // Changed from number to string for UUID
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<TravelPhoto | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { canEdit } = usePermissions()
  const { supabaseUser } = useAuth() // Added Supabase user for authentication

  useEffect(() => {
    setMounted(true)
    if (!initialPhotos && canEdit && supabaseUser) {
      loadPhotos()
    }
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [initialPhotos, canEdit, supabaseUser])

  const loadPhotos = async () => {
    if (canEdit && supabaseUser) {
      try {
        const travelPhotos = (await photoManager.getPhotosByCategory("travel")) as TravelPhoto[]
        setPhotos(travelPhotos)
      } catch (error) {
        console.error("Error loading photos:", error)
      }
    }
  }

  const handleUploadComplete = async (results: { url: string; storagePath: string }[]) => {
    console.log(`[v0] Successfully uploaded ${results.length} photos`)
    await loadPhotos() // Reload photos after upload
    setIsUploading(false)
  }

  const handleUploadError = (error: string) => {
    console.error("[v0] Upload error:", error)
    alert(`上传失败: ${error}`)
    setIsUploading(false)
  }

  const handleDeletePhoto = async (id: string) => {
    // Changed parameter type to string
    if (!canEdit || !supabaseUser) return

    if (confirm("Are you sure you want to delete this photo?")) {
      try {
        await photoManager.deletePhoto(id) // Now async
        await loadPhotos() // Reload photos after deletion
      } catch (error) {
        console.error("Error deleting photo:", error)
      }
    }
  }

  const handleSavePhoto = async (photo: TravelPhoto) => {
    if (!canEdit || !supabaseUser) return

    try {
      await photoManager.updatePhoto(photo.id, photo) // Now async
      setEditingPhoto(null)
      await loadPhotos() // Reload photos after update
    } catch (error) {
      console.error("Error updating photo:", error)
    }
  }

  const getPhotoStyle = (photo: TravelPhoto) => ({
    transform: `rotate(${photo.rotation}deg) scale(${hoveredPhoto === photo.id ? photo.scale * 1.1 : photo.scale})`,
    left: `${photo.x}%`,
    top: `${photo.y}%`,
    zIndex: hoveredPhoto === photo.id ? 20 : 10,
  })

  const getPhotoFrameClass = (type: string) => {
    switch (type) {
      case "polaroid":
        return `bg-white ${isMobile ? "p-2 pb-6" : "p-4 pb-12"} shadow-lg`
      case "postcard":
        return `bg-gradient-to-br from-yellow-50 to-orange-100 ${isMobile ? "p-1" : "p-2"} shadow-md border-2 border-orange-200`
      case "film":
        return "bg-black p-1 shadow-xl"
      default:
        return `bg-white ${isMobile ? "p-2" : "p-4"} shadow-lg`
    }
  }

  if (isMobile) {
    return (
      <div className="px-4 pb-8">
        {/* Page Header with Edit Button */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-3">
            <Plane className="w-6 h-6 text-orange-500" />
            <h1 className="font-serif text-2xl font-bold text-gray-800">Travel Memories</h1>
            <MapPin className="w-6 h-6 text-pink-500" />
          </div>
          <p className="font-sans text-sm text-gray-600 mb-4">Adventures around the world</p>

          <EditButton
            onClick={() => setIsEditMode(!isEditMode)}
            isEditMode={isEditMode}
            className="px-4 py-2 rounded-full text-sm"
          />
        </div>

        {isEditMode && canEdit && (
          <div className="mb-6">
            <EnhancedPhotoUpload
              category="travel"
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              maxFiles={5}
              className="max-w-sm mx-auto"
            />
          </div>
        )}

        {/* Mobile Grid Layout */}
        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className={`${index % 3 === 0 ? "col-span-2" : ""} transform transition-all duration-300 relative`}
              style={{
                transform: `rotate(${photo.rotation * 0.3}deg)`,
                marginTop: index % 2 === 1 ? "1rem" : "0",
              }}
            >
              <div className={`${getPhotoFrameClass(photo.type)} rounded-lg`}>
                <div className="relative overflow-hidden rounded">
                  <OptimizedImage
                    src={photo.src}
                    alt={photo.description}
                    width={isMobile ? 200 : 300}
                    height={isMobile ? 150 : 225}
                    className="w-full h-auto"
                    style={{
                      filter: photo.type === "film" ? "sepia(20%) contrast(110%)" : "none",
                    }}
                  />
                  {photo.type === "film" && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  )}

                  {isEditMode && canEdit && (
                    <div className="absolute top-1 right-1 flex gap-1">
                      <button
                        onClick={() => setEditingPhoto(photo)}
                        className="p-1 bg-white/80 hover:bg-white text-gray-600 rounded-full transition-colors"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="p-1 bg-white/80 hover:bg-white text-red-600 rounded-full transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Photo caption */}
                {photo.type === "polaroid" && (
                  <div className="mt-1 text-center">
                    <p className="font-sans text-xs text-gray-700 font-medium">{photo.description}</p>
                    <p className="font-sans text-xs text-gray-500">{photo.location}</p>
                  </div>
                )}

                {/* Postcard style info */}
                {photo.type === "postcard" && (
                  <div className="absolute bottom-1 left-1 right-1">
                    <div className="bg-white/90 rounded px-1 py-0.5">
                      <p className="font-sans text-xs text-gray-700 font-medium">{photo.location}</p>
                    </div>
                  </div>
                )}

                {/* Film strip holes - simplified for mobile */}
                {photo.type === "film" && (
                  <>
                    <div className="absolute left-0.5 top-1 bottom-1 flex flex-col justify-between">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 bg-white rounded-full" />
                      ))}
                    </div>
                    <div className="absolute right-0.5 top-1 bottom-1 flex flex-col justify-between">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 bg-white rounded-full" />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Simplified tape effects for mobile */}
              <div className="absolute -top-1 -left-1 w-4 h-4 bg-yellow-200 opacity-70 rotate-45 rounded-sm" />
            </div>
          ))}
        </div>

        {/* Bottom message */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
            <Heart className="w-4 h-4 text-pink-500" />
            <span className="font-sans text-sm text-gray-700">Every journey tells a story</span>
            <Heart className="w-4 h-4 text-pink-500" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen p-8">
      {/* Page Header with Edit Button */}
      <div className="text-center mb-12 relative z-30">
        <div className="flex justify-center items-center gap-3 mb-4">
          <Plane className="w-8 h-8 text-orange-500" />
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-800">Travel Memories</h1>
          <MapPin className="w-8 h-8 text-pink-500" />
        </div>
        <p className="font-sans text-lg text-gray-600 max-w-2xl mx-auto mb-6">
          Adventures around the world, captured in moments that take my breath away
        </p>

        <EditButton
          onClick={() => setIsEditMode(!isEditMode)}
          isEditMode={isEditMode}
          className="px-6 py-3 rounded-full"
        />

        {isEditMode && canEdit && (
          <div className="mt-4 max-w-2xl mx-auto">
            <EnhancedPhotoUpload
              category="travel"
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              maxFiles={10}
            />
          </div>
        )}
      </div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Map background pattern */}
        <div className="absolute top-20 left-10 w-32 h-32 opacity-20">
          <svg viewBox="0 0 100 100" className="w-full h-full text-orange-300">
            <path
              d="M20,20 Q40,10 60,20 T100,30 L100,80 Q80,90 60,80 T20,70 Z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* Compass */}
        <div className="absolute top-32 right-20 w-16 h-16 opacity-30">
          <div className="w-full h-full rounded-full border-4 border-orange-400 flex items-center justify-center">
            <div className="w-2 h-2 bg-orange-500 rounded-full" />
          </div>
        </div>

        {/* Reduced decorative elements for performance */}
        {mounted &&
          [...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            >
              {i % 3 === 0 && <Star className="w-4 h-4 text-yellow-400 opacity-60" />}
              {i % 3 === 1 && <Heart className="w-3 h-3 text-pink-400 opacity-50" />}
              {i % 3 === 2 && <Camera className="w-4 h-4 text-blue-400 opacity-40" />}
            </div>
          ))}
      </div>

      {/* Photo Scrapbook */}
      <div className="relative max-w-6xl mx-auto" style={{ height: "80vh" }}>
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="absolute cursor-pointer transition-all duration-300 hover:z-20"
            style={getPhotoStyle(photo)}
            onMouseEnter={() => setHoveredPhoto(photo.id)}
            onMouseLeave={() => setHoveredPhoto(null)}
          >
            <div className={`${getPhotoFrameClass(photo.type)} rounded-lg transition-all duration-300`}>
              <div className="relative overflow-hidden rounded">
                <OptimizedImage
                  src={photo.src}
                  alt={photo.description}
                  width={isMobile ? 200 : 300}
                  height={isMobile ? 150 : 225}
                  className="w-full h-auto"
                  style={{
                    filter: photo.type === "film" ? "sepia(20%) contrast(110%)" : "none",
                  }}
                />
                {photo.type === "film" && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                )}

                {isEditMode && canEdit && (
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => setEditingPhoto(photo)}
                      className="p-1.5 bg-white/80 hover:bg-white text-gray-600 rounded-full transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="p-1.5 bg-white/80 hover:bg-white text-red-600 rounded-full transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Photo caption */}
              {photo.type === "polaroid" && (
                <div className="mt-2 text-center">
                  <p className="font-sans text-sm text-gray-700 font-medium">{photo.description}</p>
                  <p className="font-sans text-xs text-gray-500">{photo.location}</p>
                </div>
              )}

              {/* Postcard style info */}
              {photo.type === "postcard" && (
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="bg-white/90 rounded px-2 py-1">
                    <p className="font-sans text-xs text-gray-700 font-medium">{photo.location}</p>
                  </div>
                </div>
              )}

              {/* Film strip holes */}
              {photo.type === "film" && (
                <>
                  <div className="absolute left-1 top-2 bottom-2 flex flex-col justify-between">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="w-2 h-2 bg-white rounded-full" />
                    ))}
                  </div>
                  <div className="absolute right-1 top-2 bottom-2 flex flex-col justify-between">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="w-2 h-2 bg-white rounded-full" />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Hover tooltip */}
            {hoveredPhoto === photo.id && !isEditMode && (
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-3 py-1 rounded-full text-sm font-sans whitespace-nowrap">
                {photo.location} • {photo.date}
              </div>
            )}

            {/* Tape/sticker effects */}
            <div className="absolute -top-2 -left-2 w-8 h-8 bg-yellow-200 opacity-70 rotate-45 rounded-sm" />
            {Math.random() > 0.5 && (
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-pink-200 opacity-60 rotate-12 rounded-sm" />
            )}
          </div>
        ))}
      </div>

      {/* Bottom decorative elements */}
      <div className="text-center mt-16 relative z-30">
        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
          <Heart className="w-5 h-5 text-pink-500" />
          <span className="font-sans text-gray-700">Every journey tells a story</span>
          <Heart className="w-5 h-5 text-pink-500" />
        </div>
      </div>

      {editingPhoto && canEdit && (
        <EditPhotoModal photo={editingPhoto} onSave={handleSavePhoto} onClose={() => setEditingPhoto(null)} />
      )}
    </div>
  )
}

function EditPhotoModal({
  photo,
  onSave,
  onClose,
}: {
  photo: TravelPhoto
  onSave: (photo: TravelPhoto) => void
  onClose: () => void
}) {
  const [editedPhoto, setEditedPhoto] = useState<TravelPhoto>(photo)

  const handleSave = () => {
    onSave(editedPhoto)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-semibold text-gray-800">Edit Travel Photo</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-sans text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={editedPhoto.title}
                onChange={(e) => setEditedPhoto({ ...editedPhoto, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block font-sans text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={editedPhoto.description}
                onChange={(e) => setEditedPhoto({ ...editedPhoto, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block font-sans text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={editedPhoto.location}
                onChange={(e) => setEditedPhoto({ ...editedPhoto, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block font-sans text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={editedPhoto.date}
                onChange={(e) => setEditedPhoto({ ...editedPhoto, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block font-sans text-sm font-medium text-gray-700 mb-1">Photo Type</label>
              <select
                value={editedPhoto.type}
                onChange={(e) =>
                  setEditedPhoto({ ...editedPhoto, type: e.target.value as "polaroid" | "postcard" | "film" })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="polaroid">Polaroid</option>
                <option value="postcard">Postcard</option>
                <option value="film">Film</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
