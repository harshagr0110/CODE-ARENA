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
  onPlayerJoined?: () => void
  onPlayerLeft?: () => void
  onGameStart?: () => void
  onQuestionReady?: (clearCountdown?: boolean) => void
}

export function RoomRealtime({ roomId, userId, username, children, onPlayerJoined, onPlayerLeft, onGameStart, onQuestionReady }: RoomRealtimeProps) {
  const { socket, isConnected } = useSocket()
  const router = useRouter()
  const lastJoinToastRef = useRef<Map<string, number>>(new Map())
  const seenPlayersRef = useRef<Set<string>>(new Set())
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasJoinedRoomRef = useRef(false)
  const countdownTimeoutsRef = useRef<NodeJS.Timeout[]>([])
  const countdownStartedRef = useRef(false)
  const hasNavigatedRef = useRef(false)
  const lastRefreshTimeRef = useRef<number>(0)

  // CRITICAL: Join the socket room when user views the room page
  // This ensures socket-server knows which room to send events for
  useEffect(() => {
    if (!socket || !isConnected || !roomId || !userId) return

    // Emit join-room to socket-server to register this client for room events
    if (!hasJoinedRoomRef.current) {
      hasJoinedRoomRef.current = true
      socket.emit("join-room", { roomId, userId, username })
    }

    return () => {
      // Clean up when component unmounts or socket disconnects
      socket.emit("leave-room", { roomId, userId })
      hasJoinedRoomRef.current = false
    }
  }, [socket, isConnected, roomId, userId, username])

  // Listen for socket events to trigger parent callbacks
  useEffect(() => {
    if (!socket || !isConnected) return

    // Game started - trigger 5-second countdown
    const handleGameStarted = (data: { startTime: number; durationSeconds: number; questionId: string }) => {
      if (countdownStartedRef.current) return // Prevent multiple countdowns
      countdownStartedRef.current = true

      // Clear any existing countdown timeouts
      countdownTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
      countdownTimeoutsRef.current = []

      // Trigger parent to start countdown
      if (onGameStart) {
        onGameStart()
      }

      // Pre-fetch question at 2 seconds to have it ready when countdown ends
      countdownTimeoutsRef.current.push(setTimeout(() => {
        // Trigger refresh early to pre-load question (don't clear countdown yet)
        if (onQuestionReady) {
          onQuestionReady(false) // false = don't clear countdown yet
        }
      }, 2000))

      // Show countdown toasts
      toast.info("Game starting in 5...", { duration: 1000 })
      countdownTimeoutsRef.current.push(setTimeout(() => toast.info("Game starting in 4...", { duration: 1000 }), 1000))
      countdownTimeoutsRef.current.push(setTimeout(() => toast.info("Game starting in 3...", { duration: 1000 }), 2000))
      countdownTimeoutsRef.current.push(setTimeout(() => toast.info("Game starting in 2...", { duration: 1000 }), 3000))
      countdownTimeoutsRef.current.push(setTimeout(() => toast.info("Game starting in 1...", { duration: 1000 }), 4000))
      countdownTimeoutsRef.current.push(setTimeout(() => {
        toast.success("Game started!", { duration: 2000 })
        // Final call to clear countdown and ensure question is loaded
        if (onQuestionReady) {
          onQuestionReady(true) // true = clear countdown now
        }
        countdownStartedRef.current = false // Reset after countdown
      }, 5000))
    }

    // Time expired - go to results
    const handleTimeExpired = () => {
      if (hasNavigatedRef.current) return
      hasNavigatedRef.current = true
      toast.info("Time's up! Redirecting to results...", { duration: 2000 })
      setTimeout(() => {
        router.push(`/rooms/${roomId}/results`)
      }, 1500)
    }

    // Winner announced - go to results
    const handleWinnerAnnounced = (data: { winnerName?: string }) => {
      if (hasNavigatedRef.current) return
      hasNavigatedRef.current = true
      const message = data.winnerName ? `${data.winnerName} won!` : "Game ended!"
      toast.success(message)
      setTimeout(() => {
        router.push(`/rooms/${roomId}/results`)
      }, 2000)
    }

    // Player joined - show toast AND trigger room data refresh (debounced)
    const handlePlayerJoined = (data: { username?: string; userId: string }) => {
      // Don't process for self
      if (data.userId === userId) {
        return
      }
      
      // Show toast notification
      if (data.username) {
        const now = Date.now()
        const lastShown = lastJoinToastRef.current.get(data.userId) || 0
        if (now - lastShown > 3000) { // Throttle to 3 seconds
          toast.success(`${data.username} joined the room`)
          lastJoinToastRef.current.set(data.userId, now)
        }
      }
      
      // Debounced refresh to prevent infinite loops (max once per 1 second)
      const now = Date.now()
      if (now - lastRefreshTimeRef.current > 1000) {
        lastRefreshTimeRef.current = now
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current)
        }
        refreshTimeoutRef.current = setTimeout(() => {
          if (onPlayerJoined) onPlayerJoined()
        }, 500) // Small delay to batch multiple joins
      }
    }

    // Player left - show toast AND trigger room data refresh (debounced)
    const handlePlayerLeft = (data: { userId: string }) => {
      if (data.userId !== userId) {
        toast.info("A player left the room")
      }
      
      // Debounced refresh
      const now = Date.now()
      if (now - lastRefreshTimeRef.current > 1000) {
        lastRefreshTimeRef.current = now
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current)
        }
        refreshTimeoutRef.current = setTimeout(() => {
          if (onPlayerLeft) onPlayerLeft()
        }, 500)
      }
    }

    // Register event listeners
    socket.on("game-started", handleGameStarted)
    socket.on("time-expired", handleTimeExpired)
    socket.on("winner-announced", handleWinnerAnnounced)
    socket.on("player-joined", handlePlayerJoined)
    socket.on("player-left", handlePlayerLeft)

    // Cleanup listeners
    return () => {
      countdownTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
      countdownTimeoutsRef.current = []
      socket.off("game-started", handleGameStarted)
      socket.off("time-expired", handleTimeExpired)
      socket.off("winner-announced", handleWinnerAnnounced)
      socket.off("player-joined", handlePlayerJoined)
      socket.off("player-left", handlePlayerLeft)
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
        refreshTimeoutRef.current = null
      }
    }
  }, [socket, isConnected, roomId, userId, username, router, onPlayerJoined, onPlayerLeft, onGameStart, onQuestionReady])

  return <>{children}</>
}
