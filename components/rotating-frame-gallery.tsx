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
  Upload,
} from "lucide-react"
import { PhotoManager } from "@/lib/photo-manager"

interface DailyPhoto {
  id: string
  src: string
  title: string
  description?: string
  date: string
  category: string
  time: string
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
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const PHOTOS_PER_PAGE = 6

  useEffect(() => {
    if (initialPhotos && initialPhotos.length > 0) {
      setPhotos(initialPhotos)
    } else {
      loadPhotos()
    }
  }, [initialPhotos])

  const loadPhotos = async () => {
    const photoManager = PhotoManager.getInstance()
    const dailyPhotos = await photoManager.getPhotosByCategory("daily")
    setPhotos(
      dailyPhotos.map((photo) => ({
        id: photo.id,
        src: photo.src,
        title: photo.title,
        description: photo.description,
        date: photo.date || new Date().toISOString().split("T")[0],
        category: photo.category,
        time: photo.time || "Daily",
        mood: photo.mood || "peaceful",
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("图片文件太大，请选择小于10MB的图片")
        return
      }

      if (!file.type.startsWith("image/")) {
        alert("请选择有效的图片文件")
        return
      }

      setIsUploading(true)
      setUploadProgress(0)

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      try {
        const photoManager = PhotoManager.getInstance()
        const { url, storagePath } = await photoManager.uploadPhoto(file, "daily")

        setUploadProgress(95)

        const newPhoto = {
          src: url,
          title: `Daily Moment ${photos.length + 1}`,
          description: "A beautiful daily moment",
          date: new Date().toISOString().split("T")[0],
          category: "daily" as const,
          time: "Daily",
          mood: "peaceful",
        }

        await photoManager.addPhoto(newPhoto, storagePath)
        setUploadProgress(100)

        setTimeout(async () => {
          await loadPhotos()
          setIsUploading(false)
          setUploadProgress(0)
          clearInterval(progressInterval)
        }, 500)
      } catch (error) {
        console.error("Failed to upload photo:", error)
        alert("上传失败，请重试")
        setIsUploading(false)
        setUploadProgress(0)
      }
    }
    event.target.value = ""
  }

  const handleDeletePhoto = async (photoId: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    if (!confirm("确定要删除这张照片吗？此操作无法撤销。")) {
      return
    }

    try {
      console.log("[v0] Attempting to delete photo with ID:", photoId)
      const photoManager = PhotoManager.getInstance()
      const success = await photoManager.deletePhoto(photoId)

      if (success) {
        console.log("[v0] Photo deleted successfully")
        await loadPhotos()
        if (currentIndex >= currentPagePhotos.length - 1) {
          setCurrentIndex(Math.max(0, currentPagePhotos.length - 2))
        }
      } else {
        throw new Error("删除失败")
      }
    } catch (error) {
      console.error("[v0] Failed to delete photo:", error)
      alert("删除失败，请重试")
    }
  }

  const handleEditPhoto = (photo: DailyPhoto) => {
    setEditingPhoto(photo)
  }

  const handleSaveEdit = async () => {
    if (editingPhoto) {
      try {
        const photoManager = PhotoManager.getInstance()
        await photoManager.updatePhoto(editingPhoto.id, {
          title: editingPhoto.title,
          description: editingPhoto.description || editingPhoto.title,
          src: editingPhoto.src,
        })
        await loadPhotos()
        setEditingPhoto(null)
      } catch (error) {
        console.error("Failed to update photo:", error)
        alert("更新失败，请重试")
      }
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
          <h2 className="font-serif text-2xl text-gray-600 mb-4">还没有日常照片</h2>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-6 py-3 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white rounded-full transition-colors duration-200 flex items-center gap-2 mx-auto"
          >
            {isUploading ? (
              <>
                <Upload className="w-5 h-5 animate-spin" />
                上传中...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                添加第一张照片
              </>
            )}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        </div>
      </div>
    )
  }

  const currentPhoto = currentPagePhotos[currentIndex]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {isUploading && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">上传中...</span>
              <span className="text-sm text-gray-500">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-pink-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="text-center pt-8 pb-6 px-4">
        <div className="flex items-center justify-center gap-4 mb-3">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-gray-800">Daily Moments</h1>
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
          <div
            className="relative bg-white rounded-3xl shadow-2xl overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="relative aspect-[3/4] overflow-hidden">
              <img
                src={currentPhoto.src || "/placeholder.svg"}
                alt={currentPhoto.title}
                className="w-full h-full object-cover transition-transform duration-500"
              />

              {isEditing && (
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleEditPhoto(currentPhoto)
                    }}
                    className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer"
                    style={{ pointerEvents: "auto" }}
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => handleDeletePhoto(currentPhoto.id, e)}
                    className="w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer"
                    style={{ pointerEvents: "auto" }}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

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

            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                {getMoodIcon(currentPhoto.mood)}
                <h3 className="font-serif text-xl font-semibold text-gray-800">{currentPhoto.title}</h3>
                <span className="ml-auto font-sans text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {currentPhoto.date}
                </span>
              </div>

              <p className="font-sans text-gray-600 leading-relaxed">{currentPhoto.description}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-full transition-colors duration-200 shadow-lg"
            >
              {isUploading ? (
                <>
                  <Upload className="w-4 h-4 animate-spin" />
                  <span className="font-sans text-sm">上传中...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span className="font-sans text-sm">添加照片</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors duration-200 shadow-lg ${
                isEditing ? "bg-gray-500 hover:bg-gray-600 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              <span className="font-sans text-sm">{isEditing ? "完成" : "编辑"}</span>
            </button>

            <button
              onClick={toggleAutoPlay}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full transition-colors duration-200 shadow-lg"
            >
              {isAutoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="font-sans text-sm">{isAutoPlay ? "暂停" : "播放"}</span>
            </button>

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

          {isEditing && (
            <div className="text-center mt-4">
              <p className="font-sans text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-full">
                点击照片上的编辑或删除按钮来管理您的图片
              </p>
            </div>
          )}

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

          <div className="text-center mt-6 md:hidden">
            <p className="font-sans text-sm text-gray-500">左右滑动浏览照片</p>
          </div>
        </div>

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
            <h3 className="font-serif text-xl font-semibold mb-4">编辑照片</h3>

            <div className="space-y-4">
              <div>
                <label className="block font-sans text-sm font-medium text-gray-700 mb-1">标题</label>
                <input
                  type="text"
                  value={editingPhoto.title}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block font-sans text-sm font-medium text-gray-700 mb-1">时间</label>
                <input
                  type="text"
                  value={editingPhoto.time}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block font-sans text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={editingPhoto.description || ""}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block font-sans text-sm font-medium text-gray-700 mb-1">心情</label>
                <select
                  value={editingPhoto.mood}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, mood: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="peaceful">平静</option>
                  <option value="joyful">快乐</option>
                  <option value="content">满足</option>
                  <option value="loving">爱意</option>
                  <option value="relaxed">放松</option>
                  <option value="romantic">浪漫</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors duration-200"
              >
                <Save className="w-4 h-4 inline mr-2" />
                保存
              </button>
              <button
                onClick={() => setEditingPhoto(null)}
                className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { RotatingFrameGallery }
