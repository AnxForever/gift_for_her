"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Upload, Check, AlertCircle, ImageIcon, Plus, Trash2 } from "lucide-react"
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
        return <Upload className="w-4 h-4 text-blue-500 animate-pulse" />
      default:
        return <ImageIcon className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${isDragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400 bg-gray-50"}
          ${isUploading ? "opacity-50 pointer-events-none" : "cursor-pointer"}
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
              w-16 h-16 rounded-full flex items-center justify-center transition-colors
              ${isDragOver ? "bg-blue-100" : "bg-gray-100"}
            `}
            >
              <Upload className={`w-8 h-8 ${isDragOver ? "text-blue-500" : "text-gray-400"}`} />
            </div>
          </div>

          <div>
            <p className="text-lg font-medium text-gray-700">
              {isDragOver ? "释放文件开始上传" : "拖拽图片到这里或点击选择"}
            </p>
            <p className="text-sm text-gray-500 mt-1">支持 JPG、PNG、GIF、WebP 格式，最大 50MB，最多 {maxFiles} 张</p>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
            disabled={isUploading}
          >
            <Plus className="w-4 h-4" />
            选择图片
          </button>
        </div>
      </div>

      {uploadQueue.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">上传进度</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {uploadQueue.map((upload) => (
              <div key={upload.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                {/* Preview thumbnail */}
                {upload.preview && (
                  <img
                    src={upload.preview || "/placeholder.svg"}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-700 truncate">{upload.file.name}</p>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(upload.status)}
                      <span className="text-xs text-gray-500">{upload.progress.toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        upload.status === "error"
                          ? "bg-red-500"
                          : upload.status === "completed"
                            ? "bg-green-500"
                            : "bg-blue-500"
                      }`}
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>

                  {upload.error && <p className="text-xs text-red-500 mt-1">{upload.error}</p>}

                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500 capitalize">
                      {upload.status === "uploading"
                        ? "上传中..."
                        : upload.status === "processing"
                          ? "处理中..."
                          : upload.status === "completed"
                            ? "完成"
                            : upload.status === "error"
                              ? "失败"
                              : "等待中..."}
                    </span>
                    <span className="text-xs text-gray-400">{(upload.file.size / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeFromQueue(upload.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  disabled={upload.status === "uploading"}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
