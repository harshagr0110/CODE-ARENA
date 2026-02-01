"use client"

import React, { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { MainLayout } from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { ResultsDisplay } from "../results-display"
import { useSocket } from "@/hooks/use-socket"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function ResultsPage() {
  const params = useParams() as { id?: string }
  const roomId = params.id || ""
  const [loading, setLoading] = useState(true)
  const [isHost, setIsHost] = useState(false)
  const [finishingGame, setFinishingGame] = useState(false)
  const router = useRouter()
  const { socket } = useSocket()

  useEffect(() => {
    // Fetch room details and check if user is host
    const initializeResults = async () => {
      try {
        // Get room data
        const roomRes = await fetch(`/api/rooms/${roomId}`)
        const roomData = await roomRes.json()

        // Get current user to check if they're the host
        const userRes = await fetch("/api/me")
        const userData = await userRes.json()
        if (userData && userData.id === roomData.hostId) {
          setIsHost(true)
        }
      } catch (error) {
      } finally {
        setLoading(false)
      }
    }

    initializeResults()

    // Listen for game-ended event
    if (socket) {
      socket.on("game-ended", () => {
        // Refresh page to ensure we have latest results
        router.refresh()
      })
    }

    return () => {
      if (socket) {
        socket.off("game-ended")
      }
    }
  }, [roomId, socket, router])

  const handleFinishGame = async () => {
    if (!isHost) return

    setFinishingGame(true)
    try {
      const response = await fetch(`/api/rooms/${roomId}/finish-game`, {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || "Failed to finish game")
        return
      }

      toast.success("Game finished! Room has been deleted.")
      setTimeout(() => {
        router.push("/rooms")
      }, 1500)
    } catch (error) {
      toast.error("Failed to finish game")
    } finally {
      setFinishingGame(false)
    }
  }

  const handleGoBack = () => {
    router.push("/rooms")
  }

  const handleRematch = () => {
    router.push(`/rooms/${roomId}`)
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Game Results</h1>
          <div className="space-x-2">
            <Button onClick={handleRematch} variant="default">
              Rematch
            </Button>
            <Button onClick={handleGoBack} variant="outline">
              Back to Rooms
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">Loading results...</div>
        ) : (
          <>
            <ResultsDisplay roomId={roomId} />

            {/* Finish Game Button - Only for Host */}
            {isHost && (
              <Card className="mt-8 bg-yellow-50 border-yellow-200">
                <CardHeader>
                  <CardTitle className="text-lg">Host Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-700">
                    Click below to finish this game and delete the room along with all related data.
                  </p>
                  <Button
                    onClick={handleFinishGame}
                    disabled={finishingGame}
                    variant="destructive"
                    className="w-full"
                  >
                    {finishingGame ? "Finishing..." : "Finish Game & Delete Room"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </MainLayout>
  )
}