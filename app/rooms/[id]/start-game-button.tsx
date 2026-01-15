"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
  const router = useRouter()

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
          difficulty: "medium",
          durationSeconds: 300,
          mode: "normal",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to start game")
      }

      // Refresh the page to show the updated game state
      router.refresh()
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
          <div className="text-sm text-gray-600">
            <p>Room: <strong>{roomName}</strong></p>
            <p>Players: <strong>{playerCount}</strong></p>
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
