"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  username: string
  email: string
  displayName: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (username: string, email: string, password: string, displayName: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)

    const users = JSON.parse(localStorage.getItem("users") || "[]")
    const foundUser = users.find((u: any) => u.email === email && u.password === password)

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser
      setUser(userWithoutPassword)
      localStorage.setItem("currentUser", JSON.stringify(userWithoutPassword))
      setIsLoading(false)
      return true
    }

    setIsLoading(false)
    return false
  }

  const register = async (username: string, email: string, password: string, displayName: string): Promise<boolean> => {
    console.log("🔄 Starting registration process for:", { username, email, displayName })
    setIsLoading(true)

    try {
      const users = JSON.parse(localStorage.getItem("users") || "[]")
      console.log("📊 Current users in localStorage:", users)

      const existingUser = users.find((u: any) => u.email === email || u.username === username)
      console.log("🔍 Existing user check:", existingUser)

      if (existingUser) {
        console.log("❌ User already exists")
        setIsLoading(false)
        return false
      }

      const newUser = {
        id: Date.now().toString(),
        username,
        email,
        displayName,
        password,
        createdAt: new Date().toISOString(),
      }
      console.log("👤 Creating new user:", { ...newUser, password: "[HIDDEN]" })

      users.push(newUser)
      localStorage.setItem("users", JSON.stringify(users))
      console.log("💾 Saved users to localStorage:", users.length, "total users")

      // Verify the save worked
      const savedUsers = JSON.parse(localStorage.getItem("users") || "[]")
      console.log("✅ Verification - users in localStorage after save:", savedUsers.length)

      const { password: _, ...userWithoutPassword } = newUser
      setUser(userWithoutPassword)
      localStorage.setItem("currentUser", JSON.stringify(userWithoutPassword))
      console.log("🎉 Registration successful, user logged in")

      setIsLoading(false)
      return true
    } catch (error) {
      console.error("💥 Registration error:", error)
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("currentUser")
  }

  return <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
