"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { MainLayout } from "@/components/main-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RoomClient } from "./room-client"
import { RoomRealtime } from "./room-realtime"
import { CodeEditor } from "./code-editor"
import { RoomActions } from "./room-actions"
import StartGameButton from "./start-game-button"

export default function RoomPage() {
  const params = useParams() as { id?: string }
  const roomId = useMemo(() => (params?.id ? String(params.id) : ""), [params])
  const router = useRouter()

    const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [room, setRoom] = useState<any | null>(null)
  const [user, setUser] = useState<{ id: string; username: string } | null>(null)
  const [question, setQuestion] = useState<any | null>(null)

  // Fetch current user and room details
  useEffect(() => {
    if (!roomId) return
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [userRes, roomRes] = await Promise.all([
          fetch("/api/me"), // optional; fallback to room GET response
          fetch(`/api/rooms/${roomId}`),
        ])

        // Room fetch is required
        if (!roomRes.ok) {
          const rj = await roomRes.json().catch(() => ({}))
          throw new Error(rj.error || `Failed to load room (${roomRes.status})`)
        }
        const roomJson = await roomRes.json()

        // Try user endpoint; if missing, infer from participants later
        let me: any = null
        if (userRes.ok) {
          me = await userRes.json().catch(() => null)
        }

        // If room has an active question, fetch it
        let questionData = null
        if (roomJson.questionId) {
          try {
            const questionRes = await fetch(`/api/questions/${roomJson.questionId}`)
            if (questionRes.ok) {
              questionData = await questionRes.json()
            }
          } catch (e) {
            console.error("Failed to fetch question:", e)
          }
        }

        if (!cancelled) {
          setRoom(roomJson)
          setUser(me && me.id ? { id: me.id, username: me.username } : null)
          setQuestion(questionData)
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load room")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [roomId])

  // Derive computed flags
  const participants: any[] = useMemo(() => {
    if (!room) return []
    try {
      return Array.isArray(room.participants) ? room.participants : JSON.parse(room.participants)
    } catch {
      return []
    }
  }, [room])

  const currentUserId = user?.id
  const isParticipant = currentUserId ? participants.some((p: any) => p.id === currentUserId) : false
  const isHost = currentUserId ? room?.hostId === currentUserId : false
  const isGameInProgress = room?.status === "in_progress"
  const isWaiting = room?.status === "waiting" || room?.status === "active"
  
  // If room has a questionId but no question object, fetch it
  useEffect(() => {
    if (room?.questionId && !question) {
      fetch(`/api/questions/${room.questionId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setQuestion(data);
          }
        });
    }
  }, [room?.questionId, question]);

  const handleRefresh = () => router.refresh()

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {loading ? (
            <Card>
              <CardContent className="py-10 text-center">Loading room…</CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="py-10 text-center text-red-600">{error}</CardContent>
            </Card>
          ) : !room ? (
            <Card>
              <CardContent className="py-10 text-center">Room not found</CardContent>
            </Card>
          ) : (
            <RoomRealtime 
              roomId={roomId} 
              userId={currentUserId || "guest"}
            >
              {/* Room header with info and actions */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {room.name || `Room ${room.joinCode}`}
                    </h1>
                    <Badge variant={isWaiting ? "outline" : isGameInProgress ? "default" : "secondary"}>
                      {isWaiting ? "Waiting" : isGameInProgress ? "In Progress" : "Finished"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Join Code:</span>
                      <code className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-mono font-bold">
                        {room.joinCode}
                      </code>
                    </div>
                    <div>
                      <span className="font-medium">Players:</span> {participants.length}
                      {room.maxPlayers ? ` / ${room.maxPlayers}` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RoomActions roomId={roomId} isHost={isHost} />
                </div>
              </div>

              {/* Join prompt if not a participant */}
              {!isParticipant && (
                <div className="mb-6">
                  <RoomClient roomId={roomId} userId={currentUserId || "guest"} initialJoined={false} />
                </div>
              )}

              {/* Room content - different UI based on status */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left column - Players list and controls */}
                <div>
                  {/* Players list */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Players</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {participants.map((p: any) => (
                          <li key={p.id} className="flex items-center justify-between">
                            <span>{p.username || p.id}</span>
                            {room.hostId === p.id && (
                              <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">Host</span>
                            )}
                          </li>
                        ))}
                        {participants.length === 0 && (
                          <li className="text-gray-500 text-sm">No players have joined yet</li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Game controls - only show if in waiting status and participant */}
                  {isParticipant && isWaiting && (
                    <div className="mb-6">
                      <StartGameButton 
                        roomId={roomId}
                        roomName={room.name || `Room ${room.joinCode}`}
                        isHost={isHost}
                        playerCount={participants.length}
                        disabled={participants.length < 2}
                      />
                    </div>
                  )}
                </div>

                {/* Right column - Game or waiting area */}
                <div>
                  {!isParticipant ? (
                    <Card>
                      <CardContent className="py-10 text-center">
                        Join the room to participate in the game.
                      </CardContent>
                    </Card>
                  ) : isWaiting ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Waiting for Game to Start</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center py-6">
                        <p className="text-gray-600 mb-4">
                          {isHost 
                            ? "As the host, you can start the game when everyone is ready." 
                            : "Waiting for the host to start the game..."}
                        </p>
                        {!isHost && participants.length < 2 && (
                          <p className="text-sm text-amber-600">Need at least 2 players to start a game.</p>
                        )}
                      </CardContent>
                    </Card>
                  ) : isGameInProgress ? (
                    <>
                      {room.questionId || question ? (
                        <CodeEditor roomId={roomId} userId={currentUserId || "guest"} question={question} />
                      ) : (
                        <Card>
                          <CardHeader>
                            <CardTitle>Loading Challenge...</CardTitle>
                          </CardHeader>
                          <CardContent className="text-center py-10">
                            <div className="animate-pulse space-y-4">
                              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                            </div>
                            <p className="text-gray-500 mt-4">Please wait while we load your coding challenge...</p>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>Game Ended</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center py-10">
                        <p className="text-gray-600 mb-4">This game has finished.</p>
                        <Button onClick={() => router.push(`/rooms/${roomId}/results`)}>
                          View Results
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </RoomRealtime>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
