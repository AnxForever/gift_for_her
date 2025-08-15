"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Copy, Share2, Check, Facebook, Twitter, Mail } from "lucide-react"

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState("")

  useEffect(() => {
    if (user && typeof window !== "undefined") {
      setShareUrl(`${window.location.origin}/gallery/${user.username}`)
    }
  }, [user])

  if (!user) return null

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy link:", err)
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea")
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand("copy")
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (fallbackErr) {
        console.error("Fallback copy failed:", fallbackErr)
      }
      document.body.removeChild(textArea)
    }
  }

  const handleSocialShare = (platform: string) => {
    const text = `Check out ${user.displayName}'s beautiful photo gallery!`
    let url = ""

    switch (platform) {
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        break
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`
        break
      case "email":
        url = `mailto:?subject=${encodeURIComponent(`${user.displayName}'s Photo Gallery`)}&body=${encodeURIComponent(`${text}\n\n${shareUrl}`)}`
        break
    }

    if (url) {
      window.open(url, "_blank", "width=600,height=400")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share2 className="w-5 h-5 text-pink-500" />
            <span>Share Your Gallery</span>
          </DialogTitle>
          <DialogDescription>
            Share your beautiful photo collection with friends and family. Anyone with this link can view your public
            gallery.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Gallery Link</label>
            <div className="flex space-x-2">
              <Input value={shareUrl} readOnly className="flex-1 text-sm" />
              <Button onClick={handleCopyLink} size="sm" className="glass-pink text-white">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            {copied && <p className="text-sm text-green-600">Link copied to clipboard!</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Share on Social Media</label>
            <div className="flex space-x-2">
              <Button
                onClick={() => handleSocialShare("facebook")}
                variant="outline"
                size="sm"
                className="flex-1 hover:bg-blue-50"
              >
                <Facebook className="w-4 h-4 mr-2 text-blue-600" />
                Facebook
              </Button>
              <Button
                onClick={() => handleSocialShare("twitter")}
                variant="outline"
                size="sm"
                className="flex-1 hover:bg-sky-50"
              >
                <Twitter className="w-4 h-4 mr-2 text-sky-500" />
                Twitter
              </Button>
              <Button
                onClick={() => handleSocialShare("email")}
                variant="outline"
                size="sm"
                className="flex-1 hover:bg-gray-50"
              >
                <Mail className="w-4 h-4 mr-2 text-gray-600" />
                Email
              </Button>
            </div>
          </div>

          <div className="border-t pt-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Preview</label>
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <p className="font-medium text-gray-800">{user.displayName}'s Photo Gallery</p>
              <p className="text-gray-600 text-xs mt-1">A beautiful collection of precious moments</p>
              <p className="text-gray-500 text-xs mt-2">{shareUrl}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
