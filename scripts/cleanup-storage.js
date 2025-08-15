// 清理Supabase存储桶中的文件
// 在浏览器控制台中运行此脚本

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanupStorage() {
  try {
    // 列出所有文件
    const { data: files, error: listError } = await supabase.storage.from("photos").list()

    if (listError) {
      console.error("Error listing files:", listError)
      return
    }

    if (files && files.length > 0) {
      // 删除所有文件
      const filePaths = files.map((file) => file.name)
      const { error: deleteError } = await supabase.storage.from("photos").remove(filePaths)

      if (deleteError) {
        console.error("Error deleting files:", deleteError)
      } else {
        console.log(`Successfully deleted ${filePaths.length} files`)
      }
    } else {
      console.log("No files to delete")
    }
  } catch (error) {
    console.error("Cleanup error:", error)
  }
}

// 运行清理
cleanupStorage()
