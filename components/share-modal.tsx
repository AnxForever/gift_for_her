"use client"

import { useState } from "react"
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

  if (!user) return null

  const shareUrl = `${window.location.origin}/gallery/${user.username}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy link:", err)
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
          <DialogDescription>Share your beautiful photo collection with friends and family.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Gallery Link</label>
            <div className="flex space-x-2">
              <Input value={shareUrl} readOnly className="flex-1" />
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
