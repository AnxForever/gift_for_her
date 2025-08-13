export interface BasePhoto {
  id: number
  src: string
  title: string
  description: string
  date: string
  category: "travel" | "selfie" | "festival" | "daily"
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
  private photos: Photo[] = []
  private currentUserId: string | null = null

  private constructor() {
    // Don't load photos in constructor anymore
  }

  static getInstance(): PhotoManager {
    if (!PhotoManager.instance) {
      PhotoManager.instance = new PhotoManager()
    }
    return PhotoManager.instance
  }

  private compressImage(file: File, maxWidth = 800, quality = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img
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

        // Draw and compress the image
        ctx?.drawImage(img, 0, 0, width, height)
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality)
        resolve(compressedDataUrl)
      }

      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(file)
    })
  }

  setCurrentUser(userId: string | null): void {
    this.currentUserId = userId
    this.loadPhotos()
  }

  private loadPhotos(): void {
    if (typeof window !== "undefined" && this.currentUserId) {
      try {
        const stored = localStorage.getItem(`gallery-photos-${this.currentUserId}`)
        if (stored) {
          this.photos = JSON.parse(stored)
        } else {
          // Initialize with empty photos for new users
          this.photos = []
          this.savePhotos()
        }
      } catch (error) {
        console.error("Failed to load photos from localStorage:", error)
        this.photos = []
      }
    } else {
      // No user logged in, empty photos
      this.photos = []
    }
  }

  private savePhotos(): void {
    if (typeof window !== "undefined" && this.currentUserId) {
      try {
        const photosJson = JSON.stringify(this.photos)
        if (photosJson.length > 4 * 1024 * 1024) {
          // 4MB limit
          console.warn("Photo data is getting large, consider reducing image quality")
        }
        localStorage.setItem(`gallery-photos-${this.currentUserId}`, photosJson)
      } catch (error) {
        if (error instanceof DOMException && error.code === 22) {
          // QuotaExceededError
          alert("Storage quota exceeded. Please delete some photos or try uploading smaller images.")
          throw new Error("Storage quota exceeded")
        }
        throw error
      }
    }
  }

  getAllPhotos(): Photo[] {
    return [...this.photos]
  }

  getPhotosByCategory<T extends Photo>(category: Photo["category"]): T[] {
    return this.photos.filter((photo) => photo.category === category) as T[]
  }

  addPhoto(photo: Omit<Photo, "id">): Photo {
    if (!this.currentUserId) {
      throw new Error("No user logged in")
    }

    const newPhoto = {
      ...photo,
      id: Math.max(0, ...this.photos.map((p) => p.id)) + 1,
    } as Photo

    this.photos.push(newPhoto)
    this.savePhotos()
    return newPhoto
  }

  updatePhoto(id: number, updates: Partial<Photo>): Photo | null {
    if (!this.currentUserId) {
      throw new Error("No user logged in")
    }

    const index = this.photos.findIndex((p) => p.id === id)
    if (index === -1) return null

    this.photos[index] = { ...this.photos[index], ...updates }
    this.savePhotos()
    return this.photos[index]
  }

  deletePhoto(id: number): boolean {
    if (!this.currentUserId) {
      throw new Error("No user logged in")
    }

    const index = this.photos.findIndex((p) => p.id === id)
    if (index === -1) return false

    this.photos.splice(index, 1)
    this.savePhotos()
    return true
  }

  uploadPhoto(file: File, category: Photo["category"]): Promise<string> {
    if (!this.currentUserId) {
      throw new Error("No user logged in")
    }

    // Use compression for better storage efficiency
    return this.compressImage(file, 800, 0.8)
  }

  getCurrentUserId(): string | null {
    return this.currentUserId
  }

  clearPhotos(): void {
    this.photos = []
    this.currentUserId = null
  }
}

export { PhotoManager }
export const photoManager = PhotoManager.getInstance()
