"use client"

import React, { useEffect, useRef } from "react"
import { useSocket } from "@/hooks/use-socket"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface RoomRealtimeProps {
  roomId: string
  userId: string
  username: string
  children: React.ReactNode
  onGameStart?: () => void
  onParticipantsChange?: () => void
}

export function RoomRealtime({ roomId, userId, username, children, onGameStart, onParticipantsChange }: RoomRealtimeProps) {
  const { socket, isConnected } = useSocket()
  const router = useRouter()
  const lastJoinToastRef = useRef<Map<string, number>>(new Map())
  const lastParticipantsRefreshRef = useRef<number>(0)

  useEffect(() => {
    if (!socket || !isConnected) return

    // Join room on connect
    socket.emit("join-room", { roomId, userId, username })

    // Game started - refresh to load the game data
    const handleGameStarted = (data: { startTime: number; durationSeconds: number }) => {
      if (onGameStart) onGameStart()
      router.refresh()
      toast.success("Game started! Get ready...")
    }

    // Time expired - go to results
    const handleTimeExpired = () => {
      toast.info("Time's up! Redirecting to results...")
      setTimeout(() => router.push(`/rooms/${roomId}/results`), 1500)
    }

    // Winner announced - go to results
    const handleWinnerAnnounced = (data: { winnerName?: string }) => {
      const message = data.winnerName ? `${data.winnerName} won!` : "Game ended!"
      toast.success(message)
      setTimeout(() => router.push(`/rooms/${roomId}/results`), 2000)
    }

    // Player joined - just show toast, UI updates via room data
    const handlePlayerJoined = (data: { username?: string; userId: string }) => {
      // Don't show toast for self
      if (data.userId !== userId && data.username) {
        const now = Date.now()
        const lastShown = lastJoinToastRef.current.get(data.userId) || 0
        if (now - lastShown > 5000) {
          toast.success(`${data.username} joined the room`)
          lastJoinToastRef.current.set(data.userId, now)
        }
      }

      // Refresh participants list (throttled)
      const now = Date.now()
      if (onParticipantsChange && now - lastParticipantsRefreshRef.current > 800) {
        lastParticipantsRefreshRef.current = now
        onParticipantsChange()
      }
    }

    // Player left - just show toast
    const handlePlayerLeft = (data: { userId: string }) => {
      if (data.userId !== userId) {
        toast.info("A player left the room")
      }
      const now = Date.now()
      if (onParticipantsChange && now - lastParticipantsRefreshRef.current > 800) {
        lastParticipantsRefreshRef.current = now
        onParticipantsChange()
      }
    }

    // Register event listeners
    socket.on("game-started", handleGameStarted)
    socket.on("time-expired", handleTimeExpired)
    socket.on("winner-announced", handleWinnerAnnounced)
    socket.on("player-joined", handlePlayerJoined)
    socket.on("player-left", handlePlayerLeft)

    // Cleanup
    return () => {
      socket.emit("leave-room", { roomId, userId })
      socket.off("game-started", handleGameStarted)
      socket.off("time-expired", handleTimeExpired)
      socket.off("winner-announced", handleWinnerAnnounced)
      socket.off("player-joined", handlePlayerJoined)
      socket.off("player-left", handlePlayerLeft)
    }
  }, [socket, isConnected, roomId, userId, username, router, onGameStart, onParticipantsChange])

  return <>{children}</>
}
