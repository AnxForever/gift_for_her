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
              <Heart className="w-3 h-3 text-pink-300 opacity-60" />
            </div>
          ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="fade-in-up">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Sparkles className="w-16 h-16 text-pink-400 floating-animation" />
              <div className="absolute -top-2 -right-2">
                <Heart className="w-6 h-6 text-pink-500 animate-pulse" />
              </div>
            </div>
          </div>

          <h1 className="font-serif text-5xl md:text-7xl font-bold text-gray-800 mb-6 leading-tight">
            Welcome to My
            <span className="block text-pink-500">Heart's Gallery</span>
          </h1>

          <p className="font-sans text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            A beautiful collection of precious moments, captured with love and presented as a gift from my heart to
            yours.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleExploreMemories}
              className="px-8 py-3 bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/20 text-gray-800 font-sans font-semibold rounded-full transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl backdrop-saturate-150"
            >
              Explore Memories
            </button>
            <button
              onClick={handleLeaveMessage}
              className="px-8 py-3 bg-pink-100/30 backdrop-blur-lg border border-pink-200/40 hover:bg-pink-100/40 text-pink-700 font-sans font-semibold rounded-full transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl backdrop-saturate-150"
            >
              Leave a Message
            </button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-pink-300 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-pink-400 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  )
}
