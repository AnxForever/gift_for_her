"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation" // 添加路由导入
import { Heart, Sparkles } from "lucide-react"

export default function HeroSection() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter() // 添加路由实例

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleExploreMemories = () => {
    router.push("/gallery/travel")
  }

  const handleLeaveMessage = () => {
    router.push("/messages")
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 romantic-gradient opacity-90" />

      {/* Floating particles */}
      <div className="absolute inset-0">
        {mounted &&
          [...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            >
              <Heart className="w-2 h-2 sm:w-3 sm:h-3 text-pink-300 opacity-60" />
            </div>
          ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="fade-in-up">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="relative">
              <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-pink-400 floating-animation" />
              <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2">
                <Heart className="w-4 h-4 sm:w-6 sm:h-6 text-pink-500 animate-pulse" />
              </div>
            </div>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-800 mb-4 sm:mb-6 leading-tight">
            Welcome to My
            <span className="block text-pink-500">Heart's Gallery</span>
          </h1>

          <p className="font-sans text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-2">
            A beautiful collection of precious moments, captured with love and presented as a gift from my heart to
            yours.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <button
              onClick={handleExploreMemories}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/20 text-gray-800 font-sans font-semibold rounded-full transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl backdrop-saturate-150 touch-manipulation min-w-[200px]"
            >
              <span className="text-sm sm:text-base">Explore Memories</span>
            </button>
            <button
              onClick={handleLeaveMessage}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-pink-100/30 backdrop-blur-lg border border-pink-200/40 hover:bg-pink-100/40 text-pink-700 font-sans font-semibold rounded-full transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl backdrop-saturate-150 touch-manipulation min-w-[200px]"
            >
              <span className="text-sm sm:text-base">Leave a Message</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-5 h-8 sm:w-6 sm:h-10 border-2 border-pink-300 rounded-full flex justify-center">
          <div className="w-1 h-2 sm:h-3 bg-pink-400 rounded-full mt-1 sm:mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  )
}
