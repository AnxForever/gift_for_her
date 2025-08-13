"use client"

import { useState, useEffect } from "react"
import { Heart, Star, Sparkles, Music, Book, Coffee, Flower, Sun, Moon } from "lucide-react"

interface PersonalityTrait {
  icon: string
  title: string
  description: string
  color: string
}

const personalityTraits: PersonalityTrait[] = [
  {
    icon: "heart",
    title: "Kind Heart",
    description: "Her gentle soul touches everyone around her with warmth and compassion",
    color: "text-pink-500",
  },
  {
    icon: "star",
    title: "Bright Spirit",
    description: "She lights up every room with her radiant smile and positive energy",
    color: "text-yellow-500",
  },
  {
    icon: "book",
    title: "Curious Mind",
    description: "Always eager to learn and explore new ideas with endless enthusiasm",
    color: "text-blue-500",
  },
  {
    icon: "music",
    title: "Creative Soul",
    description: "Her artistic nature brings beauty and inspiration to everything she touches",
    color: "text-purple-500",
  },
  {
    icon: "coffee",
    title: "Cozy Moments",
    description: "She finds joy in life's simple pleasures and creates comfort wherever she goes",
    color: "text-amber-500",
  },
  {
    icon: "flower",
    title: "Natural Beauty",
    description: "Like a blooming flower, she brings grace and elegance to the world",
    color: "text-green-500",
  },
]

const favoriteThings = [
  "Morning coffee with a good book",
  "Sunset walks in the garden",
  "Handwritten letters and vintage postcards",
  "Cozy rainy afternoons",
  "Fresh flowers and their gentle fragrance",
  "Soft melodies and classical music",
  "Homemade cookies and warm tea",
  "Stargazing on clear nights",
]

export default function AboutHerPage() {
  const [mounted, setMounted] = useState(false)
  const [visibleTraits, setVisibleTraits] = useState<Set<number>>(new Set())

  useEffect(() => {
    setMounted(true)
    // Animate traits in sequence
    personalityTraits.forEach((_, index) => {
      setTimeout(() => {
        setVisibleTraits((prev) => new Set([...prev, index]))
      }, index * 300)
    })
  }, [])

  const getIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case "heart":
        return <Heart className={className} />
      case "star":
        return <Star className={className} />
      case "book":
        return <Book className={className} />
      case "music":
        return <Music className={className} />
      case "coffee":
        return <Coffee className={className} />
      case "flower":
        return <Flower className={className} />
      default:
        return <Heart className={className} />
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        {mounted &&
          [...Array(25)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${4 + Math.random() * 3}s`,
              }}
            >
              {i % 5 === 0 && <Heart className="w-3 h-3 text-pink-300 opacity-60" />}
              {i % 5 === 1 && <Star className="w-4 h-4 text-yellow-300 opacity-50" />}
              {i % 5 === 2 && <Sparkles className="w-3 h-3 text-purple-300 opacity-40" />}
              {i % 5 === 3 && <Flower className="w-4 h-4 text-green-300 opacity-50" />}
              {i % 5 === 4 && <Sun className="w-3 h-3 text-orange-300 opacity-60" />}
            </div>
          ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="relative inline-block mb-8">
            <div className="w-48 h-48 mx-auto rounded-full overflow-hidden shadow-2xl border-8 border-white">
              <img
                src="/placeholder.svg?height=400&width=400"
                alt="Her beautiful portrait"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -top-4 -right-4 bg-pink-500 text-white p-3 rounded-full animate-pulse">
              <Heart className="w-6 h-6" />
            </div>
          </div>

          <h1 className="font-serif text-5xl md:text-6xl font-bold text-gray-800 mb-4">About Her</h1>
          <div className="max-w-3xl mx-auto">
            <p className="font-sans text-xl text-gray-600 leading-relaxed mb-6">
              She is the sunshine that brightens my darkest days, the gentle breeze that calms my restless heart, and
              the beautiful melody that makes life worth living.
            </p>
            <p className="font-sans text-lg text-gray-500 italic">
              "In her eyes, I see the reflection of all the beauty this world has to offer."
            </p>
          </div>
        </div>

        {/* Personality Traits */}
        <div className="mb-16">
          <h2 className="font-serif text-3xl font-bold text-center text-gray-800 mb-12">What Makes Her Special</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {personalityTraits.map((trait, index) => (
              <div
                key={index}
                className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 transform ${
                  visibleTraits.has(index) ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full">
                    {getIcon(trait.icon, `w-6 h-6 ${trait.color}`)}
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-gray-800">{trait.title}</h3>
                </div>
                <p className="font-sans text-gray-600 leading-relaxed">{trait.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Favorite Things */}
        <div className="mb-16">
          <h2 className="font-serif text-3xl font-bold text-center text-gray-800 mb-12">Things That Make Her Smile</h2>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-4">
              {favoriteThings.map((thing, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl p-4 hover:bg-white/80 transition-all duration-300 hover:scale-105"
                >
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" />
                  <p className="font-sans text-gray-700">{thing}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Love Letter Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 rounded-3xl p-8 md:p-12 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full">
                <Heart className="w-5 h-5 text-pink-500" />
                <span className="font-serif text-lg font-semibold text-gray-800">A Message from My Heart</span>
                <Heart className="w-5 h-5 text-pink-500" />
              </div>
            </div>

            <div className="space-y-6 text-center">
              <p className="font-sans text-lg text-gray-700 leading-relaxed">
                Every day with you feels like a beautiful dream that I never want to wake up from. Your laughter is the
                sweetest music to my ears, and your smile is the brightest star in my sky.
              </p>
              <p className="font-sans text-lg text-gray-700 leading-relaxed">
                You have this incredible ability to find magic in the ordinary, to see beauty where others might not
                look, and to spread joy wherever you go. Your kindness knows no bounds, and your heart is pure gold.
              </p>
              <p className="font-sans text-lg text-gray-700 leading-relaxed">
                This website is just a small token of my appreciation for all the wonderful moments we've shared and all
                the beautiful memories yet to come. You deserve all the love and happiness in the world.
              </p>
              <div className="pt-4">
                <p className="font-serif text-xl font-semibold text-gray-800 italic">
                  "You are my today and all of my tomorrows."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Decoration */}
        <div className="text-center mt-16">
          <div className="flex justify-center items-center gap-4 mb-8">
            <Moon className="w-6 h-6 text-indigo-400 animate-pulse" />
            <div className="flex gap-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4 text-yellow-400 animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
            <Sun className="w-6 h-6 text-orange-400 animate-pulse" />
          </div>
          <p className="font-sans text-gray-500 italic">Made with endless love and countless cups of coffee ☕</p>
        </div>
      </div>
    </div>
  )
}
