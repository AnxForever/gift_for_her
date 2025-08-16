import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { revalidateTag } from "next/cache"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const category = searchParams.get("category")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const supabase = createClient()

    let query = supabase.from("photos").select("*").eq("user_id", userId).order("created_at", { ascending: false })

    if (category) {
      query = query.eq("category", category)
    }

    const { data: photos, error } = await query

    if (error) {
      console.error("Error fetching photos:", error)
      return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 })
    }

    return NextResponse.json(
      { photos },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    )
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, category, image_url, storage_path, tags } = body

    const { data: photo, error } = await supabase
      .from("photos")
      .insert({
        user_id: user.id,
        title,
        description,
        category,
        image_url,
        storage_path,
        tags: tags || [],
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating photo:", error)
      return NextResponse.json({ error: "Failed to create photo" }, { status: 500 })
    }

    revalidateTag(`photos:user:${user.id}`)
    if (category) {
      revalidateTag(`photos:user:${user.id}:${category}`)
    }

    return NextResponse.json({ photo })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
