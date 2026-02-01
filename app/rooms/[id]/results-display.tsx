"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Submission {
  id: string;
  userId: string;
  username: string;
  language: string;
  isCorrect: boolean;
  executionTime?: number;
  codeLength?: number;
  submittedAt: string;
}

interface ResultsDisplayProps {
  roomId: string
}

export function ResultsDisplay({ roomId }: ResultsDisplayProps) {
  const [results, setResults] = useState<Submission[]>([])
  const [gameInfo, setGameInfo] = useState<{
    roomName?: string
    difficulty?: string
  }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true)
        // First get room to find gameId
        const roomRes = await fetch(`/api/rooms/${roomId}`)
        if (!roomRes.ok) throw new Error("Failed to load room")
        const roomData = await roomRes.json()
        const gameId = roomData.gameId

        if (!gameId) {
          throw new Error("No game found for this room")
        }

        // Now fetch results using gameId
        const res = await fetch(`/api/games/${gameId}/results`)
        if (!res.ok) throw new Error("Failed to load results")

        const data = await res.json()
        setResults(data.submissions || [])
        setGameInfo({
          roomName: data.room?.joinCode,
          difficulty: data.game?.difficulty || "medium",
        })
      } catch (err) {
        setError("Could not load game results")
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [roomId])

  // Sort submissions by correctness and time
  const sortedResults = React.useMemo(() => {
    if (!results || results.length === 0) return []

    return [...results].sort((a, b) => {
      // Correct solutions first
      if (a.isCorrect && !b.isCorrect) return -1
      if (!a.isCorrect && b.isCorrect) return 1
      // Then by submission time
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    })
  }, [results])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p>Loading results...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!results || results.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p>No submissions found for this game.</p>
        </CardContent>
      </Card>
    );
  }

  const winner = sortedResults.length > 0 ? sortedResults[0] : null;
  const hasWinner = winner && winner.isCorrect;

  return (
    <div className="space-y-6">
      {/* Game Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Game Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-4">
              <div className="bg-gray-50 rounded-md p-3 flex-1">
                <p className="text-sm text-gray-500">Room</p>
                <p className="font-medium">{gameInfo.roomName || roomId}</p>
              </div>
              <div className="bg-gray-50 rounded-md p-3 flex-1">
                <p className="text-sm text-gray-500">Difficulty</p>
                <p className="font-medium capitalize">{gameInfo.difficulty || "Medium"}</p>
              </div>
            </div>

            {hasWinner && (
              <div className="bg-yellow-50 rounded-md p-4 border border-yellow-200">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <p className="text-sm text-gray-500">Winner</p>
                    <p className="font-bold">{winner.username || "Anonymous"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Player Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-3 text-left">Rank</th>
                  <th className="py-2 px-3 text-left">Player</th>
                  <th className="py-2 px-3 text-left">Language</th>
                  <th className="py-2 px-3 text-left">Status</th>
                  <th className="py-2 px-3 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((submission, index) => (
                  <tr key={submission.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium">
                      {index === 0
                        ? "🥇"
                        : index === 1
                          ? "🥈"
                          : index === 2
                            ? "🥉"
                            : `#${index + 1}`}
                    </td>
                    <td className="py-3 px-3">{submission.username || "Anonymous"}</td>
                    <td className="py-3 px-3">{submission.language}</td>
                    <td className="py-3 px-3">
                      {submission.isCorrect ? (
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-800"
                        >
                          Correct
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-red-100 text-red-800">
                          Incorrect
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {new Date(submission.submittedAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
