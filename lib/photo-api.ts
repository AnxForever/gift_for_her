export async function fetchPhotos(userId: string, category?: string) {
  const params = new URLSearchParams({ userId })
  if (category) params.append("category", category)

  const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/photos?${params}`, {
    next: {
      revalidate: 300, // 5 minutes
      tags: category ? [`photos:user:${userId}:${category}`] : [`photos:user:${userId}`],
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch photos")
  }

  const data = await response.json()
  return data.photos
}

export async function createPhoto(photoData: {
  title: string
  description?: string
  category: string
  image_url: string
  storage_path: string
  tags?: string[]
}) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/photos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(photoData),
  })

  if (!response.ok) {
    throw new Error("Failed to create photo")
  }

  return response.json()
}
