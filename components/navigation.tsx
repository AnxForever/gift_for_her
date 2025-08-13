"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Heart, Camera, User, MessageCircle, Home, LogOut, Share2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { photoManager } from "@/lib/photo-manager"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ShareModal } from "@/components/share-modal"

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    photoManager.setCurrentUser(user?.id || null)
  }, [user])

  const handleLogout = () => {
    logout()
    photoManager.clearPhotos()
    router.push("/login")
  }

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/gallery/travel", label: "Travel", icon: Camera },
    { href: "/gallery/daily", label: "Daily", icon: Heart },
    { href: "/gallery/selfie", label: "Selfie", icon: User },
    { href: "/gallery/festival", label: "Festival", icon: Heart },
    { href: "/about", label: "About Her", icon: User },
    { href: "/messages", label: "Messages", icon: MessageCircle },
  ]

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-pink-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <Heart className="w-6 h-6 text-pink-400" />
              <span className="font-serif font-bold text-xl text-gray-800">
                {user ? `${user.displayName}'s Gallery` : "Heart's Gallery"}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center space-x-1 text-gray-600 hover:text-pink-500 transition-colors duration-200 group"
                  >
                    <Icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                    <span className="font-sans text-sm">{item.label}</span>
                  </Link>
                )
              })}

              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 text-gray-600 hover:text-pink-500">
                      <User className="w-4 h-4" />
                      <span className="font-sans text-sm">{user.displayName}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setShowShareModal(true)} className="flex items-center space-x-2">
                      <Share2 className="w-4 h-4" />
                      <span>Share Gallery</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center space-x-2 text-red-600">
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-pink-500 hover:bg-pink-50 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          {isOpen && (
            <div className="md:hidden py-4 border-t border-pink-100">
              <div className="flex flex-col space-y-3">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-pink-500 hover:bg-pink-50 rounded-md transition-colors duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-sans">{item.label}</span>
                    </Link>
                  )
                })}

                {user && (
                  <>
                    <div className="border-t border-pink-100 pt-3 mt-3">
                      <div className="px-3 py-2 text-sm text-gray-500">Signed in as {user.displayName}</div>
                      <button
                        onClick={() => setShowShareModal(true)}
                        className="flex items-center space-x-2 px-3 py-2 w-full text-left text-gray-600 hover:text-pink-500 hover:bg-pink-50 rounded-md transition-colors duration-200"
                      >
                        <Share2 className="w-4 h-4" />
                        <span className="font-sans">Share Gallery</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-3 py-2 w-full text-left text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="font-sans">Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} />
    </>
  )
}
