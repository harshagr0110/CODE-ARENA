"use client"

import { useEffect } from "react"
import { useSocket } from "@/hooks/use-socket"
import { useRouter } from "next/navigation"

interface RoomRealtimeProps {
  roomId: string
  userId: string
  children: React.ReactNode
}

export function RoomRealtime({ roomId, userId, children }: RoomRealtimeProps) {
  const { socket, isConnected } = useSocket()
  const router = useRouter()

  useEffect(() => {
    if (!socket || !isConnected) return

    // Join room
    socket.emit("join-room", { roomId, userId })

    // Game started - refresh to load question
    const handleGameStarted = () => {
      router.refresh()
    }

    // Time expired - show results
    const handleTimeExpired = () => {
      setTimeout(() => {
        router.push(`/rooms/${roomId}/results`)
      }, 1000)
    }

    // Winner announced - navigate to results
    const handleWinnerAnnounced = () => {
      setTimeout(() => {
        router.push(`/rooms/${roomId}/results`)
      }, 2000)
    }

    // Player joined or left
    const handlePlayerChange = () => {
      router.refresh()
    }

    // Submission update
    const handleSubmission = () => {
      router.refresh()
    }

    socket.on("game-started", handleGameStarted)
    socket.on("time-expired", handleTimeExpired)
    socket.on("winner-announced", handleWinnerAnnounced)
    socket.on("player-joined", handlePlayerChange)
    socket.on("player-left", handlePlayerChange)
    socket.on("submission-update", handleSubmission)

    return () => {
      socket.emit("leave-room", { roomId })
      socket.off("game-started", handleGameStarted)
      socket.off("time-expired", handleTimeExpired)
      socket.off("winner-announced", handleWinnerAnnounced)
      socket.off("player-joined", handlePlayerChange)
      socket.off("player-left", handlePlayerChange)
      socket.off("submission-update", handleSubmission)
    }
  }, [socket, isConnected, roomId, userId, router])

  return <>{children}</>
}
