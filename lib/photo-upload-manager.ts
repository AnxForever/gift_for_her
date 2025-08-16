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

  private isMobile(): boolean {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 768
    )
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

      const isMobile = this.isMobile()
      const mobileMaxWidth = isMobile ? Math.min(maxWidth, 600) : maxWidth
      const mobileQuality = isMobile ? Math.min(quality, 0.7) : quality

      console.log("[v0] Starting image compression", {
        isMobile,
        originalSize: file.size,
        maxWidth: mobileMaxWidth,
        quality: mobileQuality,
      })

      img.onload = async () => {
        try {
          await new Promise((resolve) => setTimeout(resolve, 10))
          onProgress?.(20)

          let { width, height } = img

          if (isMobile && file.size < 2 * 1024 * 1024 && width <= mobileMaxWidth && height <= mobileMaxWidth) {
            console.log("[v0] Skipping compression for small mobile image")
            onProgress?.(100)
            resolve(file)
            return
          }

          if (width > height) {
            if (width > mobileMaxWidth) {
              height = (height * mobileMaxWidth) / width
              width = mobileMaxWidth
            }
          } else {
            if (height > mobileMaxWidth) {
              width = (width * mobileMaxWidth) / height
              height = mobileMaxWidth
            }
          }

          console.log("[v0] Resizing image", {
            originalWidth: img.width,
            originalHeight: img.height,
            newWidth: width,
            newHeight: height,
          })

          canvas.width = width
          canvas.height = height

          if (ctx) {
            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = isMobile ? "medium" : "high"
            ctx.fillStyle = "white"
            ctx.fillRect(0, 0, width, height)

            await new Promise((resolve) => setTimeout(resolve, 10))
            onProgress?.(40)

            ctx.drawImage(img, 0, 0, width, height)
          }

          await new Promise((resolve) => setTimeout(resolve, 10))
          onProgress?.(60)

          requestAnimationFrame(() => {
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  console.log("[v0] Compression completed", {
                    originalSize: file.size,
                    compressedSize: blob.size,
                    compressionRatio: (((file.size - blob.size) / file.size) * 100).toFixed(1) + "%",
                  })
                  onProgress?.(100)
                  resolve(blob)
                } else {
                  reject(new Error("Failed to compress image"))
                }
              },
              "image/jpeg",
              mobileQuality,
            )
          })
        } catch (error) {
          console.error("[v0] Compression error:", error)
          reject(error)
        }
      }

      img.onerror = () => {
        console.error("[v0] Failed to load image for compression")
        reject(new Error("Failed to load image"))
      }

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

  private async uploadWithProgress(
    filePath: string,
    blob: Blob,
    onUploadProgress: (progress: number) => void,
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // Get upload URL and headers from Supabase
        const { data: authData } = await supabase.auth.getUser()
        if (!authData?.user) {
          throw new Error("Not authenticated")
        }

        // Create form data for upload
        const formData = new FormData()
        formData.append("file", blob)

        // Use XMLHttpRequest for progress tracking
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100
            console.log("[v0] Upload progress:", progress + "%")
            onUploadProgress(progress)
          }
        })

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(filePath)
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`))
          }
        })

        xhr.addEventListener("error", () => {
          reject(new Error("Upload failed"))
        })

        // Get Supabase storage URL and auth headers
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const uploadUrl = `${supabaseUrl}/storage/v1/object/photos/${filePath}`

        xhr.open("POST", uploadUrl)
        xhr.setRequestHeader("Authorization", `Bearer ${session?.access_token}`)
        xhr.setRequestHeader("apikey", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        xhr.send(formData)
      } catch (error) {
        reject(error)
      }
    })
  }

  async uploadSingleFile(file: File, options: UploadOptions): Promise<{ url: string; storagePath: string }> {
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    console.log("[v0] Starting upload for file:", file.name, "Size:", file.size)

    const validation = this.validateFile(file)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    const preview = await this.generatePreview(file)

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
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData?.user) {
        throw new Error("请先登录后再上传照片")
      }

      const user = authData.user

      uploadProgress.status = "uploading"
      uploadProgress.progress = 10
      this.uploadQueue.set(uploadId, uploadProgress)
      options.onProgress?.(uploadProgress)

      console.log("[v0] Starting compression...")

      const isMobile = this.isMobile()
      const compressionMaxWidth = isMobile ? 600 : options.maxWidth || 800
      const compressionQuality = isMobile ? 0.7 : options.quality || 0.8

      const compressedBlob = await this.compressImage(
        file,
        compressionMaxWidth,
        compressionQuality,
        (compressionProgress) => {
          const overallProgress = 10 + compressionProgress * 0.3 // 10-40%
          uploadProgress.progress = overallProgress
          this.uploadQueue.set(uploadId, uploadProgress)
          console.log("[v0] Compression progress:", compressionProgress + "%", "Overall:", overallProgress + "%")

          requestAnimationFrame(() => {
            options.onProgress?.(uploadProgress)
          })
        },
      )

      console.log("[v0] Compression completed, starting upload...")

      uploadProgress.progress = 40
      uploadProgress.status = "processing"
      this.uploadQueue.set(uploadId, uploadProgress)
      options.onProgress?.(uploadProgress)

      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 8)
      const fileExtension = file.name.split(".").pop() || "jpg"
      const fileName = `${timestamp}-${randomStr}.${fileExtension}`
      const filePath = `${user.id}/${options.category}/${fileName}`

      uploadProgress.progress = 50
      this.uploadQueue.set(uploadId, uploadProgress)
      options.onProgress?.(uploadProgress)

      console.log("[v0] Uploading to storage:", filePath)

      try {
        await this.uploadWithProgress(filePath, compressedBlob, (progressPercent) => {
          const overallProgress = 50 + progressPercent * 0.3 // 50-80%
          uploadProgress.progress = overallProgress
          this.uploadQueue.set(uploadId, uploadProgress)
          console.log("[v0] Upload progress:", progressPercent + "%", "Overall:", overallProgress + "%")

          requestAnimationFrame(() => {
            options.onProgress?.(uploadProgress)
          })
        })
      } catch (error) {
        // Fallback to Supabase client if XMLHttpRequest fails
        console.log("[v0] XMLHttpRequest failed, falling back to Supabase client")
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("photos")
          .upload(filePath, compressedBlob, {
            contentType: compressedBlob.type || "image/jpeg",
            upsert: false,
          })

        if (uploadError) {
          console.error("[v0] Upload error:", uploadError)
          throw new Error(`上传失败: ${uploadError.message}`)
        }
      }

      uploadProgress.progress = 80
      this.uploadQueue.set(uploadId, uploadProgress)
      options.onProgress?.(uploadProgress)

      const { data: urlData } = supabase.storage.from("photos").getPublicUrl(filePath)

      const result = {
        url: urlData.publicUrl,
        storagePath: filePath,
      }

      uploadProgress.status = "completed"
      uploadProgress.progress = 100
      uploadProgress.result = result
      this.uploadQueue.set(uploadId, uploadProgress)
      options.onProgress?.(uploadProgress)
      options.onComplete?.(result)

      console.log("[v0] Upload completed successfully")

      setTimeout(() => {
        this.uploadQueue.delete(uploadId)
      }, 5000)

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "上传失败"
      console.error("[v0] Upload failed:", errorMessage)
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

    for (let i = 0; i < files.length; i += this.maxConcurrentUploads) {
      const batch = files.slice(i, i + this.maxConcurrentUploads)

      const batchPromises = batch.map(async (file) => {
        try {
          const result = await this.uploadSingleFile(file, {
            ...options,
            onProgress: (progress) => {
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
