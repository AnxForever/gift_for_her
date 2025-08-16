import { supabase } from "./supabase"
import type { Photo } from "./photo-manager"

export interface UploadProgress {
  id: string
  file: File
  progress: number
  status: "pending" | "uploading" | "processing" | "completed" | "error"
  error?: string
  preview?: string
  result?: { url: string; storagePath: string }
}

export interface UploadOptions {
  maxWidth?: number
  quality?: number
  category: Photo["category"]
  onProgress?: (progress: UploadProgress) => void
  onComplete?: (result: { url: string; storagePath: string }) => void
  onError?: (error: string) => void
}

class PhotoUploadManager {
  private static instance: PhotoUploadManager
  private uploadQueue: Map<string, UploadProgress> = new Map()
  private maxConcurrentUploads = 3
  private activeUploads = 0

  private constructor() {}

  static getInstance(): PhotoUploadManager {
    if (!PhotoUploadManager.instance) {
      PhotoUploadManager.instance = new PhotoUploadManager()
    }
    return PhotoUploadManager.instance
  }

  private async compressImage(
    file: File,
    maxWidth = 800,
    quality = 0.8,
    onProgress?: (progress: number) => void,
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.onload = () => {
        onProgress?.(20)

        let { width, height } = img

        // Smart compression - skip if already small
        if (width <= maxWidth && height <= maxWidth && file.size < 1024 * 1024) {
          onProgress?.(100)
          resolve(file)
          return
        }

        // Calculate new dimensions maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height
            height = maxWidth
          }
        }

        canvas.width = width
        canvas.height = height

        if (ctx) {
          // Enhanced canvas settings for better quality
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = "high"
          ctx.fillStyle = "white"
          ctx.fillRect(0, 0, width, height)
          ctx.drawImage(img, 0, 0, width, height)
        }

        onProgress?.(60)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              onProgress?.(100)
              resolve(blob)
            } else {
              reject(new Error("Failed to compress image"))
            }
          },
          "image/jpeg",
          quality,
        )
      }

      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(file)
      onProgress?.(10)
    })
  }

  private generatePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = () => reject(new Error("Failed to generate preview"))
      reader.readAsDataURL(file)
    })
  }

  private validateFile(file: File): { valid: boolean; error?: string } {
    if (!file.type.startsWith("image/")) {
      return { valid: false, error: "请选择图片文件 (JPG, PNG, GIF, WebP)" }
    }

    if (file.size > 50 * 1024 * 1024) {
      return { valid: false, error: "图片文件不能超过50MB" }
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: "不支持的图片格式，请使用 JPG、PNG、GIF 或 WebP" }
    }

    return { valid: true }
  }

  async uploadSingleFile(file: File, options: UploadOptions): Promise<{ url: string; storagePath: string }> {
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Validate file
    const validation = this.validateFile(file)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // Generate preview
    const preview = await this.generatePreview(file)

    // Create upload progress entry
    const uploadProgress: UploadProgress = {
      id: uploadId,
      file,
      progress: 0,
      status: "pending",
      preview,
    }

    this.uploadQueue.set(uploadId, uploadProgress)
    options.onProgress?.(uploadProgress)

    try {
      // Check authentication
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData?.user) {
        throw new Error("请先登录后再上传照片")
      }

      const user = authData.user

      // Update status to uploading
      uploadProgress.status = "uploading"
      uploadProgress.progress = 10
      this.uploadQueue.set(uploadId, uploadProgress)
      options.onProgress?.(uploadProgress)

      // Compress image with progress tracking
      const compressedBlob = await this.compressImage(
        file,
        options.maxWidth || 800,
        options.quality || 0.8,
        (compressionProgress) => {
          uploadProgress.progress = 10 + compressionProgress * 0.3 // 10-40%
          this.uploadQueue.set(uploadId, uploadProgress)
          options.onProgress?.(uploadProgress)
        },
      )

      uploadProgress.progress = 40
      uploadProgress.status = "processing"
      this.uploadQueue.set(uploadId, uploadProgress)
      options.onProgress?.(uploadProgress)

      // Generate unique filename
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 8)
      const fileExtension = file.name.split(".").pop() || "jpg"
      const fileName = `${timestamp}-${randomStr}.${fileExtension}`
      const filePath = `${user.id}/${options.category}/${fileName}`

      uploadProgress.progress = 50
      this.uploadQueue.set(uploadId, uploadProgress)
      options.onProgress?.(uploadProgress)

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("photos")
        .upload(filePath, compressedBlob, {
          contentType: compressedBlob.type || "image/jpeg",
          upsert: false,
        })

      if (uploadError) {
        throw new Error(`上传失败: ${uploadError.message}`)
      }

      uploadProgress.progress = 80
      this.uploadQueue.set(uploadId, uploadProgress)
      options.onProgress?.(uploadProgress)

      // Get public URL
      const { data: urlData } = supabase.storage.from("photos").getPublicUrl(uploadData.path)

      const result = {
        url: urlData.publicUrl,
        storagePath: uploadData.path,
      }

      // Mark as completed
      uploadProgress.status = "completed"
      uploadProgress.progress = 100
      uploadProgress.result = result
      this.uploadQueue.set(uploadId, uploadProgress)
      options.onProgress?.(uploadProgress)
      options.onComplete?.(result)

      // Clean up after delay
      setTimeout(() => {
        this.uploadQueue.delete(uploadId)
      }, 5000)

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "上传失败"
      uploadProgress.status = "error"
      uploadProgress.error = errorMessage
      this.uploadQueue.set(uploadId, uploadProgress)
      options.onProgress?.(uploadProgress)
      options.onError?.(errorMessage)
      throw error
    }
  }

  async uploadMultipleFiles(files: File[], options: UploadOptions): Promise<{ url: string; storagePath: string }[]> {
    const results: { url: string; storagePath: string }[] = []
    const errors: string[] = []

    // Process files in batches to avoid overwhelming the system
    for (let i = 0; i < files.length; i += this.maxConcurrentUploads) {
      const batch = files.slice(i, i + this.maxConcurrentUploads)

      const batchPromises = batch.map(async (file) => {
        try {
          const result = await this.uploadSingleFile(file, {
            ...options,
            onProgress: (progress) => {
              // Aggregate progress for batch
              const overallProgress = {
                ...progress,
                progress: ((i + batch.indexOf(file)) / files.length) * 100 + progress.progress / files.length,
              }
              options.onProgress?.(overallProgress)
            },
          })
          results.push(result)
          return result
        } catch (error) {
          const errorMessage = `${file.name}: ${error instanceof Error ? error.message : "上传失败"}`
          errors.push(errorMessage)
          throw error
        }
      })

      // Wait for current batch to complete before starting next
      await Promise.allSettled(batchPromises)
    }

    if (errors.length > 0) {
      throw new Error(`部分文件上传失败:\n${errors.join("\n")}`)
    }

    return results
  }

  getUploadQueue(): UploadProgress[] {
    return Array.from(this.uploadQueue.values())
  }

  cancelUpload(uploadId: string): void {
    const upload = this.uploadQueue.get(uploadId)
    if (upload && upload.status === "uploading") {
      upload.status = "error"
      upload.error = "用户取消上传"
      this.uploadQueue.set(uploadId, upload)
    }
  }

  clearCompleted(): void {
    for (const [id, upload] of this.uploadQueue.entries()) {
      if (upload.status === "completed" || upload.status === "error") {
        this.uploadQueue.delete(id)
      }
    }
  }
}

export const photoUploadManager = PhotoUploadManager.getInstance()
