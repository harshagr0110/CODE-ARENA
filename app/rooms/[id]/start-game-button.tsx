"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSocket } from "@/hooks/use-socket"

interface StartGameButtonProps {
  roomId: string
  roomName: string
  isHost: boolean
  playerCount: number
  disabled?: boolean
}

const StartGameButton: React.FC<StartGameButtonProps> = ({ 
  roomId, 
  roomName, 
  isHost, 
  playerCount,
  disabled = false 
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState("medium")
  const [durationSeconds, setDurationSeconds] = useState(300)
  const router = useRouter()
  const { socket, isConnected } = useSocket()

  const handleStartGame = async () => {
    if (!isHost) {
      setError("Only the host can start the game")
      return
    }

    if (playerCount < 2) {
      setError("Need at least 2 players to start")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/games/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          difficulty,
          durationSeconds,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to start game")
      }

      // Broadcast to room - socket will handle refreshing all clients
      // Use server's startedAt time from the API response, not client time
      if (socket && isConnected) {
        const serverStartTime = data?.game?.startedAt ? new Date(data.game.startedAt).getTime() : Date.now()
        socket.emit("game-started", {
          roomId,
          questionId: data?.game?.questionId,
          durationSeconds: data?.game?.durationSeconds || durationSeconds || 300,
          startTime: serverStartTime,
        })
        // Socket server will broadcast to all clients, including this one
        // The RoomRealtime component will handle the countdown and refresh
      }
    } catch (err: any) {
      setError(err.message || "Failed to start game")
    } finally {
      setLoading(false)
    }
  }

  if (!isHost) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-600">Waiting for host to start the game...</p>
          <p className="text-sm text-gray-500 mt-2">Players: {playerCount}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Start Game</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-gray-600 space-y-1">
            <p>Room: <strong>{roomName}</strong></p>
            <p>Players: <strong>{playerCount}</strong></p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <label className="font-medium">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-medium">Duration</label>
              <select
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(Number(e.target.value))}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value={180}>3 minutes</option>
                <option value={300}>5 minutes</option>
                <option value={600}>10 minutes</option>
              </select>
            </div>
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}

          <Button 
            onClick={handleStartGame} 
            disabled={disabled || loading}
            className="w-full"
            size="lg"
          >
            {loading ? "Starting Game..." : "Start Game"}
          </Button>

          {disabled && (
            <p className="text-xs text-gray-500 text-center">
              Need at least 2 players to start
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default StartGameButton
