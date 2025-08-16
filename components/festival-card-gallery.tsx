"use client"
import { useState, useEffect } from "react"
import { Camera, Edit3, Plus, X, Heart } from "lucide-react"
import { PhotoManager } from "@/lib/photo-manager"
import EnhancedPhotoUpload from "./enhanced-photo-upload"

interface FestivalPhoto {
  id: number
  src: string
  festival: string
  date: string
  title: string
  description: string
  memories: string[]
}

interface FestivalCardGalleryProps {
  initialPhotos?: FestivalPhoto[]
}

export default function FestivalCardGallery({ initialPhotos }: FestivalCardGalleryProps = {}) {
  const [mounted, setMounted] = useState(false)
  const [festivalPhotos, setFestivalPhotos] = useState<FestivalPhoto[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<number | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    festival: "",
    date: "",
    memories: ["", "", ""],
  })

  useEffect(() => {
    setMounted(true)
    if (initialPhotos && initialPhotos.length > 0) {
      const formattedPhotos: FestivalPhoto[] = initialPhotos.map((photo) => ({
        id: photo.id,
        src: photo.src,
        festival: photo.festival || "Special Day",
        date: photo.date || "2024",
        title: photo.title || photo.caption,
        description: photo.description || photo.caption,
        memories: photo.memories || ["Beautiful moments", "Sweet memories"],
      }))
      setFestivalPhotos(formattedPhotos)
    } else {
      loadPhotos()
    }
  }, [initialPhotos])

  const loadPhotos = async () => {
    const photoManager = PhotoManager.getInstance()
    const photos = await photoManager.getPhotosByCategory("festival")

    const formattedPhotos: FestivalPhoto[] = photos.map((photo) => ({
      id: photo.id,
      src: photo.src,
      festival: photo.festival || "Special Day",
      date: photo.date || "2024",
      title: photo.title || photo.caption,
      description: photo.description || photo.caption,
      memories: photo.memories || ["Beautiful moments", "Sweet memories"],
    }))

    setFestivalPhotos(formattedPhotos)
  }

  const handlePhotoUpload = async (files: File[]) => {
    setIsUploading(true)
    try {
      const photoManager = PhotoManager.getInstance()

      for (const file of files) {
        const newPhoto = {
          src: URL.createObjectURL(file),
          caption: "New festival celebration",
          category: "festival" as const,
          title: "New Celebration",
          description: "A beautiful festival moment",
          festival: "Special Day",
          date: new Date().toISOString().split("T")[0],
          memories: ["Beautiful moments", "Sweet memories"],
        }
        await photoManager.addPhoto(newPhoto)
      }

      await loadPhotos()
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeletePhoto = (photoId: number) => {
    if (confirm("Are you sure you want to delete this photo?")) {
      const photoManager = PhotoManager.getInstance()
      photoManager.deletePhoto(photoId)
      loadPhotos()
    }
  }

  const startEditPhoto = (photo: FestivalPhoto) => {
    setEditingPhoto(photo.id)
    setEditForm({
      title: photo.title,
      description: photo.description,
      festival: photo.festival,
      date: photo.date,
      memories: [...photo.memories, "", ""].slice(0, 3),
    })
  }

  const savePhotoEdit = () => {
    if (editingPhoto) {
      const photoManager = PhotoManager.getInstance()
      const updateData = {
        title: editForm.title,
        description: editForm.description,
        festival: editForm.festival,
        date: editForm.date,
        memories: editForm.memories.filter((m) => m.trim() !== ""),
      }
      photoManager.updatePhoto(editingPhoto, updateData)
      setEditingPhoto(null)
      loadPhotos()
    }
  }

  const getRandomRotation = (index: number) => {
    const rotations = [-8, -4, -2, 0, 2, 4, 6, 8, -6, 3, -5, 7]
    return rotations[index % rotations.length]
  }

  const getRandomOffset = (index: number) => {
    const offsets = [
      { x: 0, y: 0 },
      { x: 10, y: -5 },
      { x: -8, y: 8 },
      { x: 12, y: 3 },
      { x: -6, y: -10 },
      { x: 8, y: 12 },
    ]
    return offsets[index % offsets.length]
  }

  if (festivalPhotos.length === 0) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{
          backgroundImage: `
               radial-gradient(circle at 20% 50%, rgba(139, 69, 19, 0.1) 0%, transparent 50%),
               radial-gradient(circle at 80% 20%, rgba(160, 82, 45, 0.1) 0%, transparent 50%),
               radial-gradient(circle at 40% 80%, rgba(210, 180, 140, 0.1) 0%, transparent 50%)
             `,
          backgroundColor: "#f5f1eb",
        }}
      >
        <div className="text-center">
          <Camera className="w-16 h-16 text-amber-700 mx-auto mb-4" />
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-amber-900 mb-2">No Festival Photos Yet</h2>
          <p className="font-sans text-amber-700 mb-6">Start your vintage photo collection!</p>
          <EnhancedPhotoUpload
            onUpload={handlePhotoUpload}
            category="festival"
            className="inline-block"
            buttonClassName="px-6 py-3 bg-amber-800 text-cream rounded-lg font-sans font-medium hover:bg-amber-900 transition-colors shadow-lg"
            buttonText="Add First Photo"
            icon={<Plus className="w-5 h-5 inline mr-2" />}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{
        backgroundImage: `
             radial-gradient(circle at 20% 50%, rgba(139, 69, 19, 0.1) 0%, transparent 50%),
             radial-gradient(circle at 80% 20%, rgba(160, 82, 45, 0.1) 0%, transparent 50%),
             radial-gradient(circle at 40% 80%, rgba(210, 180, 140, 0.1) 0%, transparent 50%),
             url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23d2b48c' fillOpacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
           `,
        backgroundColor: "#f5f1eb",
      }}
    >
      <div className="text-center mb-16 px-4">
        <h1 className="font-serif text-4xl md:text-6xl font-bold text-amber-900 mb-4 tracking-wide">
          Festival Memories
        </h1>
        <p className="font-serif text-lg text-amber-800 italic max-w-2xl mx-auto leading-relaxed mb-8">
          "A collection of our most cherished celebrations"
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <EnhancedPhotoUpload
            onUpload={handlePhotoUpload}
            category="festival"
            className="inline-block"
            buttonClassName="px-6 py-3 bg-green-700 text-cream rounded-lg font-sans font-medium hover:bg-green-800 transition-all duration-300 shadow-md"
            buttonText="Add Photo"
            icon={<Plus className="w-5 h-5 inline mr-2" />}
            disabled={isUploading}
          />

          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-6 py-3 rounded-lg font-sans font-medium transition-all duration-300 shadow-md ${
              isEditMode
                ? "bg-amber-800 text-cream hover:bg-amber-900"
                : "bg-cream text-amber-800 border-2 border-amber-300 hover:bg-amber-50"
            }`}
            disabled={isUploading}
          >
            <Edit3 className="w-5 h-5 inline mr-2" />
            {isEditMode ? "Done Editing" : "Edit Photos"}
          </button>
        </div>
      </div>

      {isUploading && (
        <div className="fixed top-4 right-4 bg-amber-800 text-cream px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-cream border-t-transparent"></div>
            <span className="font-sans text-sm">Uploading photos...</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 lg:gap-16">
          {festivalPhotos.map((photo, index) => {
            const rotation = getRandomRotation(index)
            const offset = getRandomOffset(index)

            return (
              <div
                key={photo.id}
                className="relative group"
                style={{
                  transform: `rotate(${rotation}deg) translate(${offset.x}px, ${offset.y}px)`,
                  transformOrigin: "center center",
                }}
              >
                <div
                  className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-16 h-8 bg-amber-200 opacity-60 rounded-sm shadow-sm z-10"
                  style={{
                    background: "linear-gradient(45deg, #f4e4bc 0%, #e6d3a3 50%, #f4e4bc 100%)",
                    transform: `translateX(-50%) rotate(${-rotation * 0.3}deg)`,
                  }}
                />

                <div className="bg-white p-4 pb-16 shadow-2xl transform transition-all duration-500 hover:scale-105 hover:rotate-0 hover:shadow-3xl">
                  <div className="relative overflow-hidden">
                    <img
                      src={photo.src || "/placeholder.svg"}
                      alt={photo.title}
                      className="w-full aspect-square object-cover"
                      style={{ filter: "sepia(10%) contrast(1.1) brightness(1.05)" }}
                    />

                    {isEditMode && (
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button
                          onClick={() => startEditPhoto(photo)}
                          className="p-1.5 bg-amber-600 text-white rounded-full hover:bg-amber-700 transition-colors shadow-lg text-xs"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeletePhoto(photo.id)}
                          className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg text-xs"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 text-center">
                    <h3 className="font-serif text-lg font-medium text-amber-900 mb-1 tracking-wide">{photo.title}</h3>
                    <p className="font-serif text-sm text-amber-700 italic">{photo.date}</p>
                    <p className="font-serif text-xs text-amber-600 mt-2 leading-relaxed">{photo.description}</p>
                  </div>
                </div>

                {index % 3 === 0 && (
                  <div
                    className="absolute -top-2 -right-2 w-6 h-8 opacity-40 z-10"
                    style={{
                      background: "linear-gradient(45deg, #c0c0c0 0%, #silver 50%, #c0c0c0 100%)",
                      clipPath: "polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)",
                      transform: `rotate(${rotation * 0.5}deg)`,
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="text-center mt-20 px-4">
        <div className="inline-flex items-center gap-3 bg-cream/80 backdrop-blur-sm px-8 py-4 rounded-lg shadow-lg border border-amber-200">
          <Heart className="w-5 h-5 text-amber-600" />
          <span className="font-serif text-lg text-amber-800 italic">
            "Every photo tells a story, every memory lives forever"
          </span>
          <Heart className="w-5 h-5 text-amber-600" />
        </div>
      </div>

      {editingPhoto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-cream rounded-lg p-6 max-w-md w-full shadow-2xl border border-amber-200">
            <h3 className="font-serif text-xl font-bold text-amber-900 mb-4">Edit Photo</h3>

            <div className="space-y-4">
              <div>
                <label className="block font-serif text-sm font-medium text-amber-800 mb-1">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-serif text-sm font-medium text-amber-800 mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  rows={3}
                />
              </div>

              <div>
                <label className="block font-serif text-sm font-medium text-amber-800 mb-1">Date</label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={savePhotoEdit}
                className="flex-1 px-4 py-2 bg-amber-800 text-cream rounded-md hover:bg-amber-900 transition-colors font-serif"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditingPhoto(null)}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors font-serif"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { FestivalCardGallery }
