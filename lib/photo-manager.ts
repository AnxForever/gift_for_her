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
        let { width, height } = img

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
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = "high"
          ctx.drawImage(img, 0, 0, width, height)
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
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

  private photoCache = new Map<string, { data: Photo[]; timestamp: number }>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

  private getCachedPhotos(key: string): Photo[] | null {
    const cached = this.photoCache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }
    return null
  }

  private setCachedPhotos(key: string, data: Photo[]): void {
    this.photoCache.set(key, { data, timestamp: Date.now() })
  }

  async getAllPhotos(): Promise<Photo[]> {
    const cacheKey = "all-photos"
    const cached = this.getCachedPhotos(cacheKey)
    if (cached) return cached

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return []
    }

    try {
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching photos:", error)
        return []
      }

      const photos = this.mapDatabasePhotosToPhotos(data || [])
      this.setCachedPhotos(cacheKey, photos)
      return photos
    } catch (error) {
      console.error("Error fetching photos:", error)
      return []
    }
  }

  async getPhotosByCategory<T extends Photo>(category: Photo["category"]): Promise<T[]> {
    const cacheKey = `category-${category}`
    const cached = this.getCachedPhotos(cacheKey)
    if (cached) return cached as T[]

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return []
    }

    try {
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("user_id", user.id)
        .eq("category", category)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching photos by category:", error)
        return []
      }

      const photos = this.mapDatabasePhotosToPhotos(data || []) as T[]
      this.setCachedPhotos(cacheKey, photos)
      return photos
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
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser()

      if (authError || !authData?.user) {
        throw new Error("请先登录后再上传照片")
      }

      const user = authData.user
      const finalStoragePath = storagePath || photo.src || `fallback/${Date.now()}`

      // Prepare data for database
      const photoData = {
        user_id: user.id,
        category: photo.category,
        title: photo.title || `${photo.category} 照片`,
        description: photo.description || "",
        image_url: photo.src,
        storage_path: finalStoragePath,
        tags: this.extractTags(photo),
        location: this.extractLocation(photo),
        mood: this.extractMood(photo),
        created_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("photos").insert(photoData).select().single()

      if (error) {
        throw new Error(`保存失败: ${error.message}`)
      }

      // Clear related cache
      this.photoCache.delete("all-photos")
      this.photoCache.delete(`category-${photo.category}`)

      return this.mapDatabasePhotosToPhotos([data])[0]
    } catch (error) {
      throw error instanceof Error ? error : new Error("保存照片失败")
    }
  }

  async uploadPhoto(file: File, category: Photo["category"]): Promise<{ url: string; storagePath: string }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser()

      if (authError || !authData?.user) {
        throw new Error("请先登录后再上传照片")
      }

      const user = authData.user

      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("请选择图片文件")
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("图片文件不能超过10MB")
      }

      // Compress image with optimized settings
      const compressedBlob = await this.compressImage(file, 600, 0.7)

      // Generate unique filename
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 8)
      const fileName = `${timestamp}-${randomStr}.jpg`
      const filePath = `${user.id}/${category}/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("photos")
        .upload(filePath, compressedBlob, {
          contentType: "image/jpeg",
          upsert: false,
        })

      if (uploadError) {
        throw new Error(`上传失败: ${uploadError.message}`)
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from("photos").getPublicUrl(uploadData.path)

      // Clear related cache
      this.photoCache.delete("all-photos")
      this.photoCache.delete(`category-${category}`)

      return {
        url: urlData.publicUrl,
        storagePath: uploadData.path,
      }
    } catch (error) {
      throw error instanceof Error ? error : new Error("上传失败")
    }
  }

  async updatePhoto(id: string, updates: Partial<Photo>): Promise<Photo | null> {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("请先登录后再编辑照片")
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
        .eq("user_id", user.id)
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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("请先登录后再删除照片")
    }

    try {
      const { data: photo, error: fetchError } = await supabase
        .from("photos")
        .select("storage_path, image_url")
        .eq("id", id)
        .eq("user_id", user.id)
        .single()

      if (fetchError) {
        console.error("Error fetching photo for deletion:", fetchError)
        throw new Error("找不到要删除的照片")
      }

      const { error: deleteError } = await supabase.from("photos").delete().eq("id", id).eq("user_id", user.id)

      if (deleteError) {
        console.error("Error deleting photo from database:", deleteError)
        throw new Error("删除照片记录失败")
      }

      if (photo?.storage_path) {
        const { error: storageError } = await supabase.storage.from("photos").remove([photo.storage_path])

        if (storageError) {
          console.error("Error deleting from storage:", storageError)
        }
      }

      return true
    } catch (error) {
      console.error("Delete operation failed:", error)
      throw error
    }
  }

  private extractTags(photo: Omit<Photo, "id" | "userId">): string[] {
    switch (photo.category) {
      case "travel":
        const travelPhoto = photo as Omit<TravelPhoto, "id" | "userId">
        return [travelPhoto.type || "polaroid"]
      case "selfie":
        const selfiePhoto = photo as Omit<SelfiePhoto, "id" | "userId">
        return [selfiePhoto.season || "spring"]
      case "festival":
        const festivalPhoto = photo as Omit<FestivalPhoto, "id" | "userId">
        return [
          festivalPhoto.festival || "celebration",
          festivalPhoto.color || "pink",
          festivalPhoto.icon || "🎉",
          ...(festivalPhoto.memories || []),
        ]
      case "daily":
        const dailyPhoto = photo as Omit<DailyPhoto, "id" | "userId">
        return [dailyPhoto.time || "morning"]
      default:
        return []
    }
  }

  private extractLocation(photo: Omit<Photo, "id" | "userId">): string | null {
    if ("location" in photo) {
      return photo.location || null
    }
    return null
  }

  private extractMood(photo: Omit<Photo, "id" | "userId">): string | null {
    if ("mood" in photo) {
      return photo.mood || null
    }
    return null
  }
}

export { PhotoManager }
export const photoManager = PhotoManager.getInstance()
