"use client"

import { useEffect, useState } from "react"
import { useSocket } from "@/hooks/use-socket"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy } from "lucide-react"

interface LeaderboardEntry {
  userId: string
  username: string
  isCorrect: boolean
  submittedAt: number
  elapsedSeconds?: number | null
}

interface LiveLeaderboardProps {
  roomId: string
  isGameActive: boolean
}

export function LiveLeaderboard({ roomId, isGameActive }: LiveLeaderboardProps) {
  const { socket, isConnected } = useSocket()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    if (isGameActive) {
      setLeaderboard([])
    }
  }, [isGameActive])

  useEffect(() => {
    if (!socket || !isConnected) return

    // Listen for submission updates and update leaderboard
    const handleSubmission = (data: {
      roomId: string
      userId: string
      username?: string
      isCorrect: boolean
      elapsedSeconds?: number | null
    }) => {
      if (data.roomId !== roomId) return

      setLeaderboard((prev) => {
        // Check if user already has a submission
        const existingIndex = prev.findIndex((e) => e.userId === data.userId)

        if (existingIndex >= 0) {
          // Update existing entry
          const updated = [...prev]
          updated[existingIndex] = {
            userId: data.userId,
            username: updated[existingIndex].username,
            isCorrect: data.isCorrect,
            submittedAt: Date.now(),
            elapsedSeconds: data.elapsedSeconds ?? updated[existingIndex].elapsedSeconds ?? null,
          }
          return updated
        } else {
          // Add new entry
          return [
            ...prev,
            {
              userId: data.userId,
              username: data.username || `User ${data.userId.slice(0, 8)}`,
              isCorrect: data.isCorrect,
              submittedAt: Date.now(),
              elapsedSeconds: data.elapsedSeconds ?? null,
            },
          ]
        }
      })
    }

    // Listen for game end and reset leaderboard
    const handleGameEnd = () => {
      // Leaderboard will stay visible, but we can clear it if needed
    }

    socket.on("submission-update", handleSubmission)
    socket.on("time-expired", handleGameEnd)
    socket.on("winner-announced", handleGameEnd)

    return () => {
      socket.off("submission-update", handleSubmission)
      socket.off("time-expired", handleGameEnd)
      socket.off("winner-announced", handleGameEnd)
    }
  }, [socket, isConnected, roomId])

  // Sort leaderboard: correct solutions first, then by submission time
  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (a.isCorrect && !b.isCorrect) return -1
    if (!a.isCorrect && b.isCorrect) return 1
    return a.submittedAt - b.submittedAt
  })

  const formatElapsed = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Live Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isGameActive ? (
          <p className="text-sm text-gray-500 text-center py-4">
            Game not started yet. Leaderboard will appear here.
          </p>
        ) : sortedLeaderboard.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            Waiting for submissions...
          </p>
        ) : (
          <div className="space-y-2">
            {sortedLeaderboard.map((entry, index) => (
              <div
                key={entry.userId}
                className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                  index === 0
                    ? "bg-yellow-50 border-2 border-yellow-300 shadow-sm"
                    : index === 1
                      ? "bg-gray-100 border border-gray-300"
                      : index === 2
                        ? "bg-orange-50 border border-orange-200"
                        : "bg-gray-50 border border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between gap-3 flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-lg font-bold text-gray-600 w-8">
                      {index === 0 && "🥇"}
                      {index === 1 && "🥈"}
                      {index === 2 && "🥉"}
                      {index > 2 && `#${index + 1}`}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm truncate">
                        {entry.username}
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.isCorrect ? (
                          <Badge variant="default" className="bg-green-500 text-xs">
                            ✓ Correct
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            ✗ Incorrect
                          </Badge>
                        )}
                        {entry.isCorrect && entry.elapsedSeconds !== null && entry.elapsedSeconds !== undefined && (
                          <Badge variant="secondary" className="text-xs">
                            {formatElapsed(entry.elapsedSeconds)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
