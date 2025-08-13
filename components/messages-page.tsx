"use client"

import type React from "react"

import { useState } from "react"
import { Send, Heart, MessageCircle, Star } from "lucide-react"

interface Message {
  id: number
  name: string
  message: string
  date: string
  color: string
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      name: "Anonymous Admirer",
      message: "Your smile brightens up the entire world! Thank you for being such an inspiration.",
      date: "2024-01-15",
      color: "from-pink-200 to-rose-200",
    },
    {
      id: 2,
      name: "A Friend",
      message: "Wishing you all the happiness and love you deserve. You're absolutely wonderful!",
      date: "2024-01-10",
      color: "from-purple-200 to-pink-200",
    },
  ])

  const [newMessage, setNewMessage] = useState({ name: "", message: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.name.trim() || !newMessage.message.trim()) return

    setIsSubmitting(true)

    // Simulate message submission
    setTimeout(() => {
      const colors = [
        "from-pink-200 to-rose-200",
        "from-purple-200 to-pink-200",
        "from-blue-200 to-purple-200",
        "from-green-200 to-blue-200",
        "from-yellow-200 to-orange-200",
      ]

      const message: Message = {
        id: Date.now(),
        name: newMessage.name,
        message: newMessage.message,
        date: new Date().toISOString().split("T")[0],
        color: colors[Math.floor(Math.random() * colors.length)],
      }

      setMessages((prev) => [message, ...prev])
      setNewMessage({ name: "", message: "" })
      setIsSubmitting(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-3 mb-4">
            <MessageCircle className="w-8 h-8 text-purple-500" />
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-800">Messages of Love</h1>
            <Heart className="w-8 h-8 text-pink-500" />
          </div>
          <p className="font-sans text-lg text-gray-600 max-w-2xl mx-auto">
            Leave a sweet message to brighten her day and let her know how special she is
          </p>
        </div>

        {/* Message Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl mb-12">
          <h2 className="font-serif text-2xl font-semibold text-gray-800 mb-6 text-center">Share Your Thoughts</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block font-sans text-sm font-medium text-gray-700 mb-2">Your Name</label>
              <input
                type="text"
                value={newMessage.name}
                onChange={(e) => setNewMessage({ ...newMessage, name: e.target.value })}
                className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all duration-200"
                placeholder="Enter your name or stay anonymous"
                required
              />
            </div>
            <div>
              <label className="block font-sans text-sm font-medium text-gray-700 mb-2">Your Message</label>
              <textarea
                value={newMessage.message}
                onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all duration-200 resize-none"
                placeholder="Write something sweet and encouraging..."
                required
              />
            </div>
            <div className="text-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-sans font-semibold rounded-full transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Messages Display */}
        <div className="space-y-6">
          <h2 className="font-serif text-2xl font-semibold text-gray-800 text-center mb-8">
            Messages from the Heart ({messages.length})
          </h2>
          {messages.map((message, index) => (
            <div
              key={message.id}
              className="transform transition-all duration-500 hover:scale-105"
              style={{
                animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
              }}
            >
              <div className={`bg-gradient-to-br ${message.color} p-1 rounded-2xl shadow-lg`}>
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
                        <Heart className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-sans font-semibold text-gray-800">{message.name}</p>
                        <p className="font-sans text-sm text-gray-500">{message.date}</p>
                      </div>
                    </div>
                    <Star className="w-5 h-5 text-yellow-500" />
                  </div>
                  <p className="font-sans text-gray-700 leading-relaxed">{message.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Message */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
            <Heart className="w-5 h-5 text-pink-500" />
            <span className="font-sans text-gray-700">Every message is a gift to her heart</span>
            <Heart className="w-5 h-5 text-pink-500" />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
