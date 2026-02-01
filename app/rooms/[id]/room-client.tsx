"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface RoomClientProps {
  roomId: string
  userId: string
  initialJoined: boolean
}

export function RoomClient({ roomId, userId, initialJoined }: RoomClientProps) {
  const [hasJoined, setHasJoined] = useState(initialJoined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleJoinRoom = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/rooms/${roomId}/join`, { method: "POST" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Failed to join room")
      }
      setHasJoined(true)
      router.refresh()
    } catch (e: any) {
      setError(e?.message || "Failed to join room")
    } finally {
      setLoading(false)
    }
  }

  if (!hasJoined) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Join this Room</h3>
          <p className="text-gray-500 mb-4">Click the button below to join this coding room.</p>
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <Button onClick={handleJoinRoom} disabled={loading} size="lg">
            {loading ? "Joining..." : "Join Room"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return null
}
