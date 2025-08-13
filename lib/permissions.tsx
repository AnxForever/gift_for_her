"use client"

import type React from "react"
import { createContext, useContext } from "react"
import { useAuth } from "@/lib/auth-context"

interface PermissionsContextType {
  canEdit: boolean
  canView: boolean
  isOwner: boolean
  isGuest: boolean
  galleryOwner: string | null
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined)

interface PermissionsProviderProps {
  children: React.ReactNode
  galleryOwner?: string | null // Username of the gallery owner
}

export function PermissionsProvider({ children, galleryOwner = null }: PermissionsProviderProps) {
  const { user } = useAuth()

  const isOwner = user && galleryOwner ? user.username === galleryOwner : user !== null && galleryOwner === null
  const isGuest = !user || (galleryOwner && user.username !== galleryOwner)
  const canEdit = isOwner
  const canView = true // Everyone can view

  return (
    <PermissionsContext.Provider
      value={{
        canEdit,
        canView,
        isOwner,
        isGuest,
        galleryOwner,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissions() {
  const context = useContext(PermissionsContext)
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionsProvider")
  }
  return context
}

// Higher-order component for protecting routes
export function withPermissions<T extends object>(
  Component: React.ComponentType<T>,
  requiredPermission: "edit" | "view" = "view",
) {
  return function ProtectedComponent(props: T) {
    const permissions = usePermissions()

    if (requiredPermission === "edit" && !permissions.canEdit) {
      return (
        <div className="min-h-screen romantic-gradient flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-2xl font-serif text-gray-800 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to edit this gallery.</p>
          </div>
        </div>
      )
    }

    if (requiredPermission === "view" && !permissions.canView) {
      return (
        <div className="min-h-screen romantic-gradient flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-2xl font-serif text-gray-800 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to view this gallery.</p>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}
