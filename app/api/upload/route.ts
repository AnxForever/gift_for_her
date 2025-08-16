import { type NextRequest, NextResponse } from "next/server"
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

    const body = await request.json()
    const { fileName, fileType, category } = body

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    // Generate unique file path
    const timestamp = Date.now()
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_")
    const filePath = `${user.id}/${category}/${timestamp}_${sanitizedFileName}`

    // Create signed upload URL
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("photos")
      .createSignedUploadUrl(filePath, {
        expiresIn: 7200, // 2 hours
      })

    if (signedUrlError) {
      console.error("Error creating signed URL:", signedUrlError)
      return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 })
    }

    return NextResponse.json({
      uploadUrl: signedUrlData.signedUrl,
      filePath,
      token: signedUrlData.token,
    })
  } catch (error) {
    console.error("Upload API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
