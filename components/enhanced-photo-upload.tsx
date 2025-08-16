"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Upload, Check, AlertCircle, ImageIcon, Plus, Trash2, Heart, X, Camera } from "lucide-react"
import { photoUploadManager, type UploadProgress } from "@/lib/photo-upload-manager"
import { photoManager, type Photo } from "@/lib/photo-manager"

interface EnhancedPhotoUploadProps {
  category: Photo["category"]
  onUploadComplete?: (results: { url: string; storagePath: string }[]) => void
  onUploadError?: (error: string) => void
  maxFiles?: number
  className?: string
}

export default function EnhancedPhotoUpload({
  category,
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
  className = "",
}: EnhancedPhotoUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadQueue, setUploadQueue] = useState<UploadProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
    setIsExpanded(true) // Auto-expand on drag over
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
        .filter((file) => file.type.startsWith("image/"))
        .slice(0, maxFiles)

      if (files.length > 0) {
        handleFileUpload(files)
      }
    },
    [maxFiles],
  )

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return

    setIsUploading(true)
    const results: { url: string; storagePath: string }[] = []

    try {
      for (const file of files) {
        const result = await photoUploadManager.uploadSingleFile(file, {
          category,
          maxWidth: 1200,
          quality: 0.85,
          onProgress: (progress) => {
            setUploadQueue((prev) => {
              const existing = prev.find((p) => p.id === progress.id)
              if (existing) {
                return prev.map((p) => (p.id === progress.id ? progress : p))
              } else {
                return [...prev, progress]
              }
            })
          },
          onComplete: (result) => {
            results.push(result)
          },
          onError: (error) => {
            console.error("Upload error:", error)
            onUploadError?.(error)
          },
        })

        const newPhoto = {
          src: result.url,
          title: `${category} Photo ${Date.now()}`,
          description: "New photo upload",
          date: new Date().toISOString().split("T")[0],
          category,
          // Add category-specific properties
          ...(category === "travel" && {
            location: "New Location",
            rotation: Math.random() * 20 - 10,
            scale: 0.9 + Math.random() * 0.2,
            x: Math.random() * 80,
            y: Math.random() * 80,
            type: "polaroid" as const,
          }),
          ...(category === "selfie" && {
            season: "Spring",
            caption: "New selfie moment",
            mood: "joyful",
          }),
          ...(category === "festival" && {
            festival: "Special Day",
            color: "pink",
            icon: "🎉",
            memories: ["Beautiful moments"],
          }),
          ...(category === "daily" && {
            time: "Daily",
            mood: "peaceful",
          }),
        }

        await photoManager.addPhoto(newPhoto as any, result.storagePath)
      }

      onUploadComplete?.(results)

      setTimeout(() => {
        onUploadComplete?.(results)
      }, 100)

      setTimeout(() => {
        setIsExpanded(false)
        setUploadQueue((prev) => prev.filter((p) => p.status !== "completed"))
      }, 3000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "上传失败"
      onUploadError?.(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, maxFiles)
    handleFileUpload(files)
    e.target.value = "" // Reset input
  }

  const removeFromQueue = (uploadId: string) => {
    photoUploadManager.cancelUpload(uploadId)
    setUploadQueue((prev) => prev.filter((p) => p.id !== uploadId))
  }

  const getStatusIcon = (status: UploadProgress["status"]) => {
    switch (status) {
      case "completed":
        return <Check className="w-3 h-3 text-green-500" />
      case "error":
        return <AlertCircle className="w-3 h-3 text-red-500" />
      case "uploading":
      case "processing":
        return <Upload className="w-3 h-3 text-pink-500 animate-pulse" />
      default:
        return <ImageIcon className="w-3 h-3 text-pink-300" />
    }
  }

  return (
    <div className={`${className}`}>
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-pink-400 to-purple-400 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 touch-manipulation group"
          aria-label="添加照片"
        >
          <Camera className="w-5 h-5 sm:w-6 sm:h-6 mx-auto" />
          <Heart className="absolute -top-1 -right-1 w-3 h-3 text-pink-200 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      )}

      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-pink-100">
              <h3 className="font-serif font-semibold text-gray-700 flex items-center gap-2">
                <Camera className="w-5 h-5 text-pink-500" />
                添加美好瞬间
              </h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4">
              <div
                className={`
                  relative border-2 border-dashed rounded-xl p-4 text-center transition-all duration-300 cursor-pointer
                  ${
                    isDragOver
                      ? "border-pink-400 bg-gradient-to-br from-pink-50 to-purple-50 shadow-md"
                      : "border-pink-200 bg-gradient-to-br from-white/60 to-pink-50/40 hover:border-pink-300"
                  }
                  ${isUploading ? "opacity-70 pointer-events-none" : ""}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                  disabled={isUploading}
                />

                <div className="space-y-3">
                  <div className="flex justify-center">
                    <div
                      className={`
                      w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                      ${
                        isDragOver
                          ? "bg-gradient-to-br from-pink-400 to-purple-400 scale-110"
                          : "bg-gradient-to-br from-pink-300 to-purple-300 hover:scale-105"
                      }
                    `}
                    >
                      <Upload className={`w-5 h-5 text-white ${isDragOver ? "animate-bounce" : ""}`} />
                    </div>
                  </div>

                  <div>
                    <p className="text-base font-serif font-semibold text-gray-700 mb-1">
                      {isDragOver ? "释放添加照片" : "选择或拖拽照片"}
                    </p>
                    <p className="text-xs text-gray-500">支持 JPG、PNG 等格式，最大 50MB</p>
                  </div>

                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-pink-400 to-purple-400 text-white hover:shadow-md hover:scale-105 transition-all duration-300 disabled:opacity-50"
                    disabled={isUploading}
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isUploading ? "上传中..." : "选择照片"}</span>
                  </button>
                </div>

                {isUploading && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-6 h-6 border-2 border-pink-300 border-t-pink-500 rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-xs text-pink-600 font-medium">处理中...</p>
                    </div>
                  </div>
                )}
              </div>

              {uploadQueue.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Heart className="w-4 h-4 text-pink-500" />
                    上传进度
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {uploadQueue.map((upload) => (
                      <div key={upload.id} className="bg-pink-50 p-3 rounded-lg border border-pink-100">
                        <div className="flex items-center gap-2">
                          {upload.preview && (
                            <div className="relative">
                              <img
                                src={upload.preview || "/placeholder.svg"}
                                alt="Preview"
                                className="w-8 h-8 object-cover rounded border border-pink-200"
                              />
                              <div className="absolute -top-1 -right-1">{getStatusIcon(upload.status)}</div>
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs font-medium text-gray-700 truncate">{upload.file.name}</p>
                              <span className="text-xs text-pink-500">{upload.progress.toFixed(0)}%</span>
                            </div>

                            <div className="w-full bg-pink-100 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  upload.status === "error"
                                    ? "bg-red-400"
                                    : upload.status === "completed"
                                      ? "bg-green-400"
                                      : "bg-gradient-to-r from-pink-400 to-purple-400"
                                }`}
                                style={{ width: `${upload.progress}%` }}
                              />
                            </div>

                            {upload.error && <p className="text-xs text-red-500 mt-1">{upload.error}</p>}
                          </div>

                          <button
                            onClick={() => removeFromQueue(upload.id)}
                            className="p-1 text-gray-400 hover:text-red-400 transition-colors rounded"
                            disabled={upload.status === "uploading"}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
