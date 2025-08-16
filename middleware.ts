import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

function rateLimit(ip: string, limit = 10, windowMs = 60000): boolean {
  const now = Date.now()
  const windowStart = now - windowMs

  const record = rateLimitMap.get(ip)

  if (!record || record.lastReset < windowStart) {
    rateLimitMap.set(ip, { count: 1, lastReset: now })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  if (pathname.startsWith("/api/upload") || pathname.startsWith("/api/photos")) {
    const ip = request.ip || request.headers.get("x-forwarded-for") || "anonymous"

    if (!rateLimit(ip, 20, 60000)) {
      // 20 requests per minute
      return new NextResponse("Too Many Requests", { status: 429 })
    }
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables not found in middleware, skipping auth")
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  // Check if this is an auth callback
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    try {
      await supabase.auth.exchangeCodeForSession(code)
      return NextResponse.redirect(new URL("/", request.url))
    } catch (error) {
      console.warn("Auth callback failed:", error)
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  // Refresh session if expired - but don't redirect to login
  try {
    await supabase.auth.getUser()
  } catch (error) {
    console.warn("Session refresh failed:", error)
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
