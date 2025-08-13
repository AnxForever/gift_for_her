"use client"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

interface Photo {
  id: number
  src: string
  location: string
  date: string
  description: string
}

interface PhotoLightboxProps {
  photos: Photo[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onNext: () => void
  onPrev: () => void
}

export default function PhotoLightbox({ photos, currentIndex, isOpen, onClose, onNext, onPrev }: PhotoLightboxProps) {
  if (!isOpen || !photos[currentIndex]) return null

  const currentPhoto = photos[currentIndex]

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-pink-300 transition-colors duration-200 z-10"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Navigation buttons */}
      <button
        onClick={onPrev}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-pink-300 transition-colors duration-200 z-10"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>

      <button
        onClick={onNext}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-pink-300 transition-colors duration-200 z-10"
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      {/* Main image */}
      <div className="max-w-4xl max-h-full flex flex-col items-center">
        <img
          src={currentPhoto.src || "/placeholder.svg"}
          alt={currentPhoto.description}
          className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
        />

        {/* Photo info */}
        <div className="mt-4 text-center text-white">
          <h3 className="font-serif text-xl font-semibold mb-2">{currentPhoto.description}</h3>
          <p className="font-sans text-pink-300">
            {currentPhoto.location} • {currentPhoto.date}
          </p>
        </div>
      </div>

      {/* Photo counter */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white font-sans text-sm">
        {currentIndex + 1} of {photos.length}
      </div>
    </div>
  )
}
