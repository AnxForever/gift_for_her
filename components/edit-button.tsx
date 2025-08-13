"use client"
import { usePermissions } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { Edit3 } from "lucide-react"

interface EditButtonProps {
  onClick: () => void
  isEditMode: boolean
  className?: string
}

export function EditButton({ onClick, isEditMode, className = "" }: EditButtonProps) {
  const { canEdit } = usePermissions()

  if (!canEdit) {
    return null
  }

  return (
    <Button
      onClick={onClick}
      className={`glass-pink text-white font-semibold transition-all duration-300 ${className}`}
      size="sm"
    >
      <Edit3 className="w-4 h-4 mr-2" />
      {isEditMode ? "Done Editing" : "Edit Photos"}
    </Button>
  )
}
