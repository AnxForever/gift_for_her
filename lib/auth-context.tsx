"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface User {
  id: string
  email: string
  createdAt: string
  displayName?: string
}

interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (
    username: string,
    email: string,
    password: string,
    displayName: string,
  ) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUserProfile = async (userId: string) => {
    const supabase = createClient()
    console.log("[v0] Fetching user profile for userId:", userId)
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("display_name")
      .eq("id", userId)
      .single()

    console.log("[v0] Profile data:", profile)
    console.log("[v0] Profile error:", error)

    return profile?.display_name || null
  }

  useEffect(() => {
    const supabase = createClient()

    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) {
        setSupabaseUser(session.user)
        const displayName = await fetchUserProfile(session.user.id)
        const userData = {
          id: session.user.id,
          email: session.user.email || "",
          createdAt: session.user.created_at,
          displayName: displayName || undefined,
        }
        setUser(userData)
      }
      setIsLoading(false)
    }

    getInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user)
        const displayName = await fetchUserProfile(session.user.id)
        const userData = {
          id: session.user.id,
          email: session.user.email || "",
          createdAt: session.user.created_at,
          displayName: displayName || undefined,
        }
        setUser(userData)
      } else {
        setSupabaseUser(null)
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setIsLoading(false)
        return { success: false, error: error.message }
      }

      if (data.user) {
        setSupabaseUser(data.user)
        const displayName = await fetchUserProfile(data.user.id)
        const userData = {
          id: data.user.id,
          email: data.user.email || "",
          createdAt: data.user.created_at,
          displayName: displayName || undefined,
        }
        setUser(userData)
      }

      setIsLoading(false)
      return { success: true }
    } catch (error) {
      setIsLoading(false)
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  const register = async (
    username: string,
    email: string,
    password: string,
    displayName: string,
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
        },
      })

      if (error) {
        setIsLoading(false)
        return { success: false, error: error.message }
      }

      if (data.user) {
        setSupabaseUser(data.user)
        const userData = {
          id: data.user.id,
          email: data.user.email || "",
          createdAt: data.user.created_at,
          displayName: displayName || undefined,
        }
        setUser(userData)
      }

      setIsLoading(false)
      return { success: true }
    } catch (error) {
      console.error("Registration error:", error)
      setIsLoading(false)
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setSupabaseUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, supabaseUser, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
