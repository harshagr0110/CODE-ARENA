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
import { Trash2, LogOut } from "lucide-react"
import { useSocket } from "@/hooks/use-socket"

interface RoomActionsProps {
  roomId: string
  isHost: boolean
  inRoom?: boolean // Whether this is on the room page or card
  variant?: "default" | "outline" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

export function RoomActions({ roomId, isHost, inRoom = true, variant = "outline", size = "default" }: RoomActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const router = useRouter()
  const { socket, isConnected } = useSocket()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete room")
      }

      router.refresh()
      router.push("/rooms")
    } catch (error) {
      // Handle error silently
    } finally {
      setIsDeleting(false)
    }
  }

  const handleLeave = async () => {
    setIsLeaving(true)
    try {
      const res = await fetch(`/api/rooms/${roomId}/leave`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to leave room")
      
      // Emit leave-room event via socket for real-time update
      if (socket && isConnected) {
        socket.emit("leave-room", { roomId })
      }
      
      router.push("/rooms")
    } catch (error) {
      console.error("Error leaving room:", error)
    } finally {
      setIsLeaving(false)
    }
  }

  // If user is host, show delete option, otherwise show leave option
  if (isHost) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant={variant} size={size} className={inRoom ? "" : "w-full"}>
            <Trash2 className="h-4 w-4 mr-2" />
            {inRoom ? "Delete Room" : "Delete"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this room?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All participants will be removed and all data will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  } else {
    return (
      <Button 
        variant={variant} 
        size={size}
        onClick={handleLeave}
        disabled={isLeaving}
        className={inRoom ? "" : "w-full"}
      >
        <LogOut className="h-4 w-4 mr-2" />
        {isLeaving ? "Leaving..." : inRoom ? "Leave Room" : "Leave"}
      </Button>
    )
  }
}
