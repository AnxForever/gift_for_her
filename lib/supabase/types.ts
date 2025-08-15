export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          email: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      photos: {
        Row: {
          id: string
          user_id: string
          category: "travel" | "selfie" | "festival" | "daily"
          title: string
          description: string | null
          image_url: string
          storage_path: string | null
          tags: string[] | null
          location: string | null
          mood: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: "travel" | "selfie" | "festival" | "daily"
          title: string
          description?: string | null
          image_url: string
          storage_path?: string | null
          tags?: string[] | null
          location?: string | null
          mood?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: "travel" | "selfie" | "festival" | "daily"
          title?: string
          description?: string | null
          image_url?: string
          storage_path?: string | null
          tags?: string[] | null
          location?: string | null
          mood?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
