import { supabase } from "./supabase"
import type { Database } from "./supabase"

export interface BasePhoto {
  id: string
  src: string
  title: string
  description: string
  date: string
  category: "travel" | "selfie" | "festival" | "daily"
  userId: string
}

export interface TravelPhoto extends BasePhoto {
  category: "travel"
  location: string
  rotation: number
  scale: number
  x: number
  y: number
  type: "polaroid" | "postcard" | "film"
}

export interface SelfiePhoto extends BasePhoto {
  category: "selfie"
  season: string
  caption: string
  mood: string
  location?: string
}

export interface FestivalPhoto extends BasePhoto {
  category: "festival"
  festival: string
  color: string
  icon: string
  memories: string[]
}

export interface DailyPhoto extends BasePhoto {
  category: "daily"
  time: string
  mood: string
}

export type Photo = TravelPhoto | SelfiePhoto | FestivalPhoto | DailyPhoto

class PhotoManager {
  private static instance: PhotoManager
  private currentUserId: string | null = null

  private constructor() {}

  static getInstance(): PhotoManager {
    if (!PhotoManager.instance) {
      PhotoManager.instance = new PhotoManager()
    }
    return PhotoManager.instance
  }

  private compressImage(file: File, maxWidth = 600, quality = 0.7): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions - 更激进的尺寸限制
        let { width, height } = img
        const maxDimension = Math.max(width, height)

        if (maxDimension > maxWidth) {
          const ratio = maxWidth / maxDimension
          width = width * ratio
          height = height * ratio
        }

        canvas.width = width
        canvas.height = height

        // 使用更好的图像质量设置
        if (ctx) {
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = "high"
          ctx.drawImage(img, 0, 0, width, height)
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(
                `[v0] Image compressed: ${file.size} -> ${blob.size} bytes (${Math.round((1 - blob.size / file.size) * 100)}% reduction)`,
              )
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
    })
  }

  setCurrentUser(userId: string | null): void {
    this.currentUserId = userId
  }

  async getAllPhotos(): Promise<Photo[]> {
    if (!this.currentUserId) {
      return []
    }

    try {
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("user_id", this.currentUserId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching photos:", error)
        return []
      }

      return this.mapDatabasePhotosToPhotos(data || [])
    } catch (error) {
      console.error("Error fetching photos:", error)
      return []
    }
  }

  async getPhotosByCategory<T extends Photo>(category: Photo["category"]): Promise<T[]> {
    if (!this.currentUserId) {
      return []
    }

    try {
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("user_id", this.currentUserId)
        .eq("category", category)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching photos by category:", error)
        return []
      }

      return this.mapDatabasePhotosToPhotos(data || []) as T[]
    } catch (error) {
      console.error("Error fetching photos by category:", error)
      return []
    }
  }

  async getPhotosByUser(username: string): Promise<Photo[]> {
    try {
      const { data: userData, error: userError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("username", username)
        .single()

      if (userError || !userData) {
        console.error("Error fetching user:", userError)
        return []
      }

      // Then get their photos
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("user_id", userData.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching user photos:", error)
        return []
      }

      return this.mapDatabasePhotosToPhotos(data || [])
    } catch (error) {
      console.error("Error fetching user photos:", error)
      return []
    }
  }

  private mapDatabasePhotosToPhotos(dbPhotos: Database["public"]["Tables"]["photos"]["Row"][]): Photo[] {
    return dbPhotos.map((dbPhoto) => {
      const basePhoto = {
        id: dbPhoto.id,
        src: dbPhoto.image_url,
        title: dbPhoto.title,
        description: dbPhoto.description || "",
        date: dbPhoto.created_at,
        category: dbPhoto.category,
        userId: dbPhoto.user_id,
      }

      // Add category-specific properties based on tags and metadata
      switch (dbPhoto.category) {
        case "travel":
          return {
            ...basePhoto,
            location: dbPhoto.location || "",
            rotation: Math.random() * 10 - 5, // Random rotation for scrapbook effect
            scale: 0.9 + Math.random() * 0.2, // Random scale
            x: Math.random() * 100, // Random position
            y: Math.random() * 100,
            type: (dbPhoto.tags?.[0] as "polaroid" | "postcard" | "film") || "polaroid",
          } as TravelPhoto

        case "selfie":
          return {
            ...basePhoto,
            season: dbPhoto.tags?.[0] || "spring",
            caption: dbPhoto.description || "",
            mood: dbPhoto.mood || "happy",
            location: dbPhoto.location,
          } as SelfiePhoto

        case "festival":
          return {
            ...basePhoto,
            festival: dbPhoto.tags?.[0] || "celebration",
            color: dbPhoto.tags?.[1] || "pink",
            icon: dbPhoto.tags?.[2] || "🎉",
            memories: dbPhoto.tags?.slice(3) || [],
          } as FestivalPhoto

        case "daily":
          return {
            ...basePhoto,
            time: dbPhoto.tags?.[0] || "morning",
            mood: dbPhoto.mood || "peaceful",
          } as DailyPhoto

        default:
          return basePhoto as Photo
      }
    })
  }

  async addPhoto(photo: Omit<Photo, "id" | "userId">, storagePath?: string): Promise<Photo | null> {
    if (!this.currentUserId) {
      throw new Error("No user logged in")
    }

    try {
      // Prepare tags based on photo category
      let tags: string[] = []
      switch (photo.category) {
        case "travel":
          const travelPhoto = photo as Omit<TravelPhoto, "id" | "userId">
          tags = [travelPhoto.type]
          break
        case "selfie":
          const selfiePhoto = photo as Omit<SelfiePhoto, "id" | "userId">
          tags = [selfiePhoto.season]
          break
        case "festival":
          const festivalPhoto = photo as Omit<FestivalPhoto, "id" | "userId">
          tags = [festivalPhoto.festival, festivalPhoto.color, festivalPhoto.icon, ...festivalPhoto.memories]
          break
        case "daily":
          const dailyPhoto = photo as Omit<DailyPhoto, "id" | "userId">
          tags = [dailyPhoto.time]
          break
      }

      // Provide default values for title and description
      const title =
        photo.title || `${photo.category.charAt(0).toUpperCase() + photo.category.slice(1)} Moment ${Date.now()}`
      const description = photo.description || `A beautiful ${photo.category} moment`

      const { data, error } = await supabase
        .from("photos")
        .insert({
          user_id: this.currentUserId,
          category: photo.category,
          title: title,
          description: description,
          image_url: photo.src,
          storage_path: storagePath || photo.src,
          tags,
          location: "location" in photo ? photo.location : null,
          mood: "mood" in photo ? photo.mood : null,
        })
        .select()
        .single()

      if (error) {
        console.error("Error adding photo:", error)
        throw new Error(`Error adding photo: ${error.message}`)
      }

      return this.mapDatabasePhotosToPhotos([data])[0]
    } catch (error) {
      console.error("Error adding photo:", error)
      throw error
    }
  }

  async uploadPhoto(file: File, category: Photo["category"]): Promise<{ url: string; storagePath: string }> {
    if (!this.currentUserId) {
      throw new Error("No user logged in")
    }

    try {
      console.log(`[v0] Starting upload for file: ${file.name}, size: ${file.size} bytes`)

      // 更激进的压缩设置
      const compressedBlob = await this.compressImage(file, 600, 0.7)
      console.log(`[v0] Image compressed successfully`)

      // Generate unique filename
      const fileExt = file.name.split(".").pop() || "jpg"
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${this.currentUserId}/${fileName}`

      console.log(`[v0] Uploading to path: ${filePath}`)

      // Upload to Supabase Storage with better error handling
      const { data, error } = await supabase.storage.from("photos").upload(filePath, compressedBlob, {
        contentType: "image/jpeg", // 强制使用JPEG格式
        upsert: false,
        cacheControl: "3600", // 1小时缓存
      })

      if (error) {
        console.error("[v0] Storage upload error:", error)
        throw new Error(`上传失败: ${error.message}`)
      }

      console.log(`[v0] Upload successful, path: ${data.path}`)

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("photos").getPublicUrl(data.path)

      console.log(`[v0] Public URL generated: ${publicUrl}`)

      return {
        url: publicUrl,
        storagePath: data.path,
      }
    } catch (error) {
      console.error("[v0] Upload failed:", error)
      throw new Error("上传失败，请检查网络连接后重试")
    }
  }

  async updatePhoto(id: string, updates: Partial<Photo>): Promise<Photo | null> {
    if (!this.currentUserId) {
      throw new Error("No user logged in")
    }

    try {
      const { data, error } = await supabase
        .from("photos")
        .update({
          title: updates.title,
          description: updates.description,
          image_url: updates.src,
        })
        .eq("id", id)
        .eq("user_id", this.currentUserId)
        .select()
        .single()

      if (error) {
        console.error("Error updating photo:", error)
        return null
      }

      return this.mapDatabasePhotosToPhotos([data])[0]
    } catch (error) {
      console.error("Error updating photo:", error)
      return null
    }
  }

  async deletePhoto(id: string): Promise<boolean> {
    if (!this.currentUserId) {
      throw new Error("No user logged in")
    }

    try {
      console.log(`[v0] Attempting to delete photo with ID: ${id}`)

      // First get the photo to get the storage path for deletion
      const { data: photo, error: fetchError } = await supabase
        .from("photos")
        .select("storage_path, image_url")
        .eq("id", id)
        .eq("user_id", this.currentUserId)
        .single()

      if (fetchError) {
        console.error("[v0] Error fetching photo for deletion:", fetchError)
        throw new Error("找不到要删除的照片")
      }

      console.log(`[v0] Found photo to delete:`, photo)

      // Delete from database first
      const { error: deleteError } = await supabase
        .from("photos")
        .delete()
        .eq("id", id)
        .eq("user_id", this.currentUserId)

      if (deleteError) {
        console.error("[v0] Error deleting photo from database:", deleteError)
        throw new Error("删除照片记录失败")
      }

      console.log(`[v0] Photo deleted from database successfully`)

      // Delete from storage if we have a storage path
      if (photo?.storage_path) {
        console.log(`[v0] Deleting from storage: ${photo.storage_path}`)
        const { error: storageError } = await supabase.storage.from("photos").remove([photo.storage_path])

        if (storageError) {
          console.error("[v0] Error deleting from storage:", storageError)
          // Don't throw here as the database record is already deleted
        } else {
          console.log(`[v0] File deleted from storage successfully`)
        }
      }

      return true
    } catch (error) {
      console.error("[v0] Delete operation failed:", error)
      throw error
    }
  }

  getCurrentUserId(): string | null {
    return this.currentUserId
  }

  clearPhotos(): void {
    this.currentUserId = null
  }
}

export { PhotoManager }
export const photoManager = PhotoManager.getInstance()
