import { type NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { category } = await request.json()

    revalidateTag(`photos:user:${user.id}`)
    if (category) {
      revalidateTag(`photos:user:${user.id}:${category}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Revalidation error:", error)
    return NextResponse.json({ error: "Failed to revalidate" }, { status: 500 })
  }
}
