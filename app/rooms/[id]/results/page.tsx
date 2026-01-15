"use client"

import React, { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { MainLayout } from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { ResultsDisplay } from "../results-display"
import { useSocket } from "@/hooks/use-socket"

export default function ResultsPage() {
  const params = useParams() as { id?: string }
  const roomId = params.id || ""
  const [gameMode, setGameMode] = useState("normal")
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { socket } = useSocket()

  useEffect(() => {
    // Fetch room details and finalize game
    const initializeResults = async () => {
      try {
        // Get room data
        const roomRes = await fetch(`/api/rooms/${roomId}`)
        const roomData = await roomRes.json()
        if (roomData && roomData.mode) {
          setGameMode(roomData.mode)
        }

        // Get the game ID from room
        if (roomData && roomData.gameId) {
          // Call game end endpoint to finalize game and update stats
          await fetch("/api/games/end", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId, gameId: roomData.gameId })
          })
        }
      } catch (error) {
        console.error("Error initializing results:", error)
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
            <Button onClick={handleRematch} variant="default">Rematch</Button>
            <Button onClick={handleGoBack} variant="outline">Back to Rooms</Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">Loading results...</div>
        ) : (
          <ResultsDisplay roomId={roomId} gameMode={gameMode} />
        )}
      </div>
    </MainLayout>
  )
}