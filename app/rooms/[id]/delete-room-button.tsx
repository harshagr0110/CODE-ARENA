"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"

interface DeleteRoomButtonProps {
  roomId: string
  roomName: string
  isCreator: boolean
  currentPlayers: number
}

export function DeleteRoomButton({ roomId, roomName, isCreator, currentPlayers }: DeleteRoomButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()


  if (!isCreator || currentPlayers > 0) {
    return null
  }


  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: "DELETE",
      })


      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete room")
      }

      window.alert("Room deleted")

      router.push("/rooms")
    } catch (error) {
      window.alert("Error: " + (error instanceof Error ? error.message : "Failed to delete room"))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          size="sm" 
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
          }}
          title="Delete this room"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Room
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Room</AlertDialogTitle>
          <AlertDialogDescription>
            <span>
              Are you sure you want to delete "{roomName}"? This action cannot be undone and will permanently remove:
            </span>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>The room and all its data</li>
              <li>All game history and submissions</li>
              <li>All participant information</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? "Deleting..." : "Delete Room"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 