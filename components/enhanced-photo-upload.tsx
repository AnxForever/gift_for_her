"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Upload, Check, AlertCircle, ImageIcon, Plus, Trash2, Heart, Sparkles } from "lucide-react"
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
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

      // Clear completed uploads after delay
      setTimeout(() => {
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
        return <Check className="w-4 h-4 text-green-500" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case "uploading":
      case "processing":
        return <Upload className="w-4 h-4 text-pink-500 animate-pulse" />
      default:
        return <ImageIcon className="w-4 h-4 text-pink-300" />
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        className={`
          relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-300 cursor-pointer
          ${
            isDragOver
              ? "border-pink-400 bg-gradient-to-br from-pink-50 to-purple-50 shadow-lg scale-[1.02]"
              : "border-pink-200 bg-gradient-to-br from-white/60 to-pink-50/40 hover:border-pink-300 hover:shadow-md"
          }
          ${isUploading ? "opacity-70 pointer-events-none" : ""}
          backdrop-blur-sm glass-card floating-animation
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

        <div className="space-y-4">
          <div className="flex justify-center relative">
            <div
              className={`
              w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-300 relative
              ${
                isDragOver
                  ? "bg-gradient-to-br from-pink-400 to-purple-400 shadow-lg scale-110"
                  : "bg-gradient-to-br from-pink-300 to-purple-300 shadow-md hover:scale-105"
              }
            `}
            >
              <Upload className={`w-8 h-8 sm:w-10 sm:h-10 text-white ${isDragOver ? "animate-bounce" : ""}`} />

              <Heart className="absolute -top-2 -right-2 w-4 h-4 text-pink-400 animate-pulse" />
              <Sparkles
                className="absolute -bottom-1 -left-2 w-3 h-3 text-purple-400 animate-pulse"
                style={{ animationDelay: "0.5s" }}
              />
            </div>
          </div>

          <div>
            <p className="text-lg sm:text-xl font-serif font-semibold text-gray-700 mb-2">
              {isDragOver ? "✨ 释放创造美好回忆 ✨" : "📸 分享你的美好瞬间"}
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">
              支持 JPG、PNG、GIF、WebP 格式
              <br />
              最大 50MB，最多 {maxFiles} 张照片
            </p>
          </div>

          <button
            type="button"
            className={`
              inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 touch-manipulation
              ${
                isDragOver
                  ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg scale-105"
                  : "glass-pink text-white hover:shadow-lg hover:scale-105"
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            disabled={isUploading}
          >
            <Plus className="w-4 h-4" />
            <span>{isUploading ? "上传中..." : "选择美好照片"}</span>
          </button>
        </div>

        {isUploading && (
          <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-3 border-pink-300 border-t-pink-500 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-pink-600 font-medium">正在处理您的美好回忆...</p>
            </div>
          </div>
        )}
      </div>

      {uploadQueue.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            <h4 className="font-serif font-semibold text-gray-700">上传进度</h4>
          </div>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {uploadQueue.map((upload) => (
              <div key={upload.id} className="glass-card p-4 rounded-xl border border-pink-100">
                <div className="flex items-center gap-3">
                  {/* Preview thumbnail with romantic border */}
                  {upload.preview && (
                    <div className="relative">
                      <img
                        src={upload.preview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-12 h-12 object-cover rounded-lg border-2 border-pink-200"
                      />
                      <div className="absolute -top-1 -right-1">{getStatusIcon(upload.status)}</div>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-700 truncate">{upload.file.name}</p>
                      <span className="text-xs text-pink-500 font-medium">{upload.progress.toFixed(0)}%</span>
                    </div>

                    <div className="w-full bg-pink-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          upload.status === "error"
                            ? "bg-red-400"
                            : upload.status === "completed"
                              ? "bg-gradient-to-r from-green-400 to-green-500"
                              : "bg-gradient-to-r from-pink-400 to-purple-400"
                        }`}
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>

                    {upload.error && <p className="text-xs text-red-500 mt-1">{upload.error}</p>}

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500 font-medium">
                        {upload.status === "uploading"
                          ? "✨ 上传中..."
                          : upload.status === "processing"
                            ? "🎨 处理中..."
                            : upload.status === "completed"
                              ? "💖 完成"
                              : upload.status === "error"
                                ? "❌ 失败"
                                : "⏳ 等待中..."}
                      </span>
                      <span className="text-xs text-gray-400">{(upload.file.size / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromQueue(upload.id)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-full hover:bg-red-50 touch-manipulation"
                    disabled={upload.status === "uploading"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
