"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Heart,
  Coffee,
  Sun,
  Moon,
  Edit3,
  Plus,
  Trash2,
  Save,
  X,
} from "lucide-react"
import { PhotoManager } from "@/lib/photo-manager"

interface DailyPhoto {
  id: number
  src: string
  title: string
  time: string
  description: string
  mood: string
}

interface RotatingFrameGalleryProps {
  initialPhotos?: DailyPhoto[]
}

export default function RotatingFrameGallery({ initialPhotos }: RotatingFrameGalleryProps = {}) {
  const [photos, setPhotos] = useState<DailyPhoto[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(true)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<DailyPhoto | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const PHOTOS_PER_PAGE = 6 // 每页最多显示6张照片

  useEffect(() => {
    if (initialPhotos && initialPhotos.length > 0) {
      setPhotos(initialPhotos)
    } else {
      loadPhotos()
    }
  }, [initialPhotos])

  const loadPhotos = () => {
    const photoManager = PhotoManager.getInstance()
    const dailyPhotos = photoManager.getPhotosByCategory("daily")
    setPhotos(
      dailyPhotos.map((photo) => ({
        id: photo.id,
        src: photo.src,
        title: photo.title,
        time: photo.location || "Daily",
        description: photo.description,
        mood: photo.tags?.[0] || "peaceful",
      })),
    )
  }

  const getCurrentPagePhotos = () => {
    const startIndex = currentPage * PHOTOS_PER_PAGE
    const endIndex = startIndex + PHOTOS_PER_PAGE
    return photos.slice(startIndex, endIndex)
  }

  const currentPagePhotos = getCurrentPagePhotos()
  const totalPages = Math.ceil(photos.length / PHOTOS_PER_PAGE)

  useEffect(() => {
    if (isAutoPlay && currentPagePhotos.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % currentPagePhotos.length)
      }, 4000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isAutoPlay, currentPagePhotos.length])

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      nextPhoto()
    }
    if (isRightSwipe) {
      prevPhoto()
    }
  }

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % currentPagePhotos.length)
    setIsAutoPlay(false)
  }

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + currentPagePhotos.length) % currentPagePhotos.length)
    setIsAutoPlay(false)
  }

  const toggleAutoPlay = () => {
    setIsAutoPlay(!isAutoPlay)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const photoManager = PhotoManager.getInstance()
        const newPhoto = {
          src: e.target?.result as string,
          title: `Daily Moment ${photos.length + 1}`,
          description: "A beautiful daily moment",
          category: "daily" as const,
          location: "Daily",
          tags: ["peaceful"],
        }
        photoManager.addPhoto(newPhoto)
        loadPhotos()
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDeletePhoto = (photoId: number) => {
    const photoManager = PhotoManager.getInstance()
    photoManager.deletePhoto(photoId)
    loadPhotos()
    if (currentIndex >= currentPagePhotos.length - 1) {
      setCurrentIndex(Math.max(0, currentPagePhotos.length - 2))
    }
  }

  const handleEditPhoto = (photo: DailyPhoto) => {
    setEditingPhoto(photo)
  }

  const handleSaveEdit = () => {
    if (editingPhoto) {
      const photoManager = PhotoManager.getInstance()
      photoManager.updatePhoto(editingPhoto.id, {
        title: editingPhoto.title,
        description: editingPhoto.description,
        location: editingPhoto.time,
        tags: [editingPhoto.mood],
      })
      loadPhotos()
      setEditingPhoto(null)
    }
  }

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1)
      setCurrentIndex(0)
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
      setCurrentIndex(0)
    }
  }

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case "peaceful":
        return <Coffee className="w-4 h-4 text-amber-500" />
      case "joyful":
        return <Sun className="w-4 h-4 text-yellow-500" />
      case "content":
        return <Moon className="w-4 h-4 text-indigo-500" />
      case "loving":
        return <Heart className="w-4 h-4 text-pink-500" />
      case "relaxed":
        return <Coffee className="w-4 h-4 text-green-500" />
      case "romantic":
        return <Heart className="w-4 h-4 text-rose-500" />
      default:
        return <Heart className="w-4 h-4 text-pink-500" />
    }
  }

  if (currentPagePhotos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-serif text-2xl text-gray-600 mb-4">No daily photos yet</h2>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-full transition-colors duration-200"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Add First Photo
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        </div>
      </div>
    )
  }

  const currentPhoto = currentPagePhotos[currentIndex]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <div className="text-center pt-8 pb-6 px-4">
        <div className="flex items-center justify-center gap-4 mb-3">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-gray-800">Daily Moments</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 rounded-full transition-colors duration-200 ${
              isEditing ? "bg-gray-500 hover:bg-gray-600 text-white" : "bg-pink-500 hover:bg-pink-600 text-white"
            }`}
          >
            {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
          </button>
        </div>
        <p className="font-sans text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
          Every ordinary day holds extraordinary beauty when shared with someone special
        </p>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={prevPage}
              disabled={currentPage === 0}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-sans text-sm text-gray-600">
              Page {currentPage + 1} of {totalPages} ({photos.length} photos total)
            </span>
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages - 1}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors duration-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="relative px-4 pb-8">
        <div className="max-w-md mx-auto">
          {/* Main Photo Card */}
          <div
            className="relative bg-white rounded-3xl shadow-2xl overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Photo */}
            <div className="relative aspect-[3/4] overflow-hidden">
              <img
                src={currentPhoto.src || "/placeholder.svg"}
                alt={currentPhoto.title}
                className="w-full h-full object-cover transition-transform duration-500"
              />

              {isEditing && (
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => handleEditPhoto(currentPhoto)}
                    className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors duration-200"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePhoto(currentPhoto.id)}
                    className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

              {/* Navigation arrows - hidden on mobile, shown on desktop */}
              <button
                onClick={prevPhoto}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:bg-white hover:scale-110 hidden md:flex"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>

              <button
                onClick={nextPhoto}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:bg-white hover:scale-110 hidden md:flex"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Photo Info */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                {getMoodIcon(currentPhoto.mood)}
                <h3 className="font-serif text-xl font-semibold text-gray-800">{currentPhoto.title}</h3>
                <span className="ml-auto font-sans text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {currentPhoto.time}
                </span>
              </div>

              <p className="font-sans text-gray-600 leading-relaxed">{currentPhoto.description}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors duration-200 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span className="font-sans text-sm">Add Photo</span>
            </button>

            {isEditing && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-colors duration-200 shadow-lg"
              >
                <X className="w-4 h-4" />
                <span className="font-sans text-sm">Done Editing</span>
              </button>
            )}

            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors duration-200 shadow-lg"
              >
                <Edit3 className="w-4 h-4" />
                <span className="font-sans text-sm">Edit Photos</span>
              </button>
            )}

            <button
              onClick={toggleAutoPlay}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full transition-colors duration-200 shadow-lg"
            >
              {isAutoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="font-sans text-sm">{isAutoPlay ? "Pause" : "Play"}</span>
            </button>

            {/* Mobile navigation buttons */}
            <div className="flex gap-2 md:hidden">
              <button
                onClick={prevPhoto}
                className="w-10 h-10 bg-pink-500 hover:bg-pink-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 shadow-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={nextPhoto}
                className="w-10 h-10 bg-pink-500 hover:bg-pink-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 shadow-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Photo Indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {currentPagePhotos.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index)
                  setIsAutoPlay(false)
                }}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentIndex ? "bg-pink-500 w-6" : "bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>

          {/* Swipe Instructions - Mobile only */}
          <div className="text-center mt-6 md:hidden">
            <p className="font-sans text-sm text-gray-500">Swipe left or right to browse photos</p>
          </div>
        </div>

        {/* Preview thumbnails - Desktop only */}
        <div className="hidden lg:block absolute top-1/2 -translate-y-1/2 left-8">
          <div className="space-y-4">
            {currentPagePhotos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => setCurrentIndex(index)}
                className={`block w-16 h-20 rounded-lg overflow-hidden transition-all duration-200 ${
                  index === currentIndex ? "ring-2 ring-pink-500 scale-110" : "opacity-60 hover:opacity-100"
                }`}
              >
                <img src={photo.src || "/placeholder.svg"} alt={photo.title} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="hidden lg:block absolute top-1/2 -translate-y-1/2 right-8">
          <div className="space-y-4">
            {currentPagePhotos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => setCurrentIndex(index)}
                className={`block w-16 h-20 rounded-lg overflow-hidden transition-all duration-200 ${
                  index === currentIndex ? "ring-2 ring-pink-500 scale-110" : "opacity-60 hover:opacity-100"
                }`}
              >
                <img src={photo.src || "/placeholder.svg"} alt={photo.title} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

      {editingPhoto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-serif text-xl font-semibold mb-4">Edit Photo</h3>

            <div className="space-y-4">
              <div>
                <label className="block font-sans text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editingPhoto.title}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block font-sans text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="text"
                  value={editingPhoto.time}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block font-sans text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingPhoto.description}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block font-sans text-sm font-medium text-gray-700 mb-1">Mood</label>
                <select
                  value={editingPhoto.mood}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, mood: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="peaceful">Peaceful</option>
                  <option value="joyful">Joyful</option>
                  <option value="content">Content</option>
                  <option value="loving">Loving</option>
                  <option value="relaxed">Relaxed</option>
                  <option value="romantic">Romantic</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors duration-200"
              >
                <Save className="w-4 h-4 inline mr-2" />
                Save
              </button>
              <button
                onClick={() => setEditingPhoto(null)}
                className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
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

export { RotatingFrameGallery }
