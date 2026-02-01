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
import { LiveLeaderboard } from "./live-leaderboard"

export default function RoomPage() {
  const params = useParams() as { id?: string }
  const roomId = useMemo(() => (params?.id ? String(params.id) : ""), [params])
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [room, setRoom] = useState<any | null>(null)
  const [user, setUser] = useState<{ id: string; username: string } | null>(null)
  const [question, setQuestion] = useState<any | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null) // 5-second countdown before game starts
  const [refreshCount, setRefreshCount] = useState(0) // Trigger for data refetch
  
  // Navigation guard to prevent race conditions
  const hasNavigatedRef = React.useRef(false)
  const pollIntervalRef = React.useRef<NodeJS.Timeout | null>(null)
  const countdownStartedRef = React.useRef(false)

  // Fetch current user and room details - also refetch on refreshCount changes (for socket-triggered updates)
  useEffect(() => {
    if (!roomId) return
    let cancelled = false
    async function load() {
      if (refreshCount === 0) setLoading(true) // Only show loading on initial load
      setError(null)
      try {
        // Parallel API calls for faster loading
        const [roomRes, meRes] = await Promise.all([
          fetch(`/api/rooms/${roomId}`),
          fetch("/api/me").catch(() => null)
        ])

        if (!roomRes.ok) {
          const rj = await roomRes.json().catch(() => ({}))
          throw new Error(rj.error || `Failed to load room (${roomRes.status})`)
        }
        const roomJson = await roomRes.json()
        const me = meRes?.ok ? await meRes.json().catch(() => null) : null

        // If room has an active question, fetch it
        let questionData = null
        const questionId = (roomJson as any).questionId
        if (questionId) {
          const questionRes = await fetch(`/api/questions/${questionId}`).catch(() => null)
          if (questionRes?.ok) {
            questionData = await questionRes.json().catch(() => null)
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
  }, [roomId, refreshCount])

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
  const isGameInProgress = !!question && room?.isActive && countdown === null // Game in progress if room is active, question loaded, and countdown finished
  const isWaiting = room?.isActive && !question && countdown === null // Waiting if room is active but no game started yet
  
  // Countdown timer before game starts (5 seconds)
  useEffect(() => {
    if (countdown === null || countdown <= 0) {
      return
    }
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          return null // Clear countdown when it reaches 1 or less
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  // Game timer - account for 5-second countdown delay
  useEffect(() => {
    if (!isGameInProgress || !room?.startedAt || countdown !== null) {
      setTimeLeft(null)
      return
    }
    const duration = room.durationSeconds ?? 300
    // Game actually starts 5 seconds after startedAt (countdown delay)
    const actualStartTime = new Date(room.startedAt).getTime() + 5000
    
    const tick = () => {
      const now = Date.now()
      const remaining = Math.max(0, Math.floor((actualStartTime + duration * 1000 - now) / 1000))
      setTimeLeft(remaining)
      
      // Auto-navigate to results when time expires (only once)
      if (remaining === 0 && !hasNavigatedRef.current) {
        hasNavigatedRef.current = true
        setTimeout(() => {
          router.push(`/rooms/${roomId}/results`)
        }, 1000)
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [isGameInProgress, room?.startedAt, room?.durationSeconds, countdown, roomId, router])

  // Reset navigation guard and countdown flag when waiting
  useEffect(() => {
    if (isWaiting) {
      hasNavigatedRef.current = false
      countdownStartedRef.current = false
    }
  }, [isWaiting])

  // Poll for room updates while waiting for game (fallback for socket events)
  useEffect(() => {
    if (!roomId || !isWaiting) {
      // Clear polling when not waiting
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
      return
    }

    // Poll every 3 seconds while waiting for game to start
    pollIntervalRef.current = setInterval(() => {
      setRefreshCount(c => c + 1)
    }, 3000)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [isWaiting, roomId])
  
  const handleRefresh = () => setRefreshCount(c => c + 1)

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
              username={user?.username || "Player"}
              onGameStart={() => {
                setCountdown(5) // Start 5-second countdown
              }}
              onQuestionReady={(clearCountdown = false) => {
                // Refresh to load question (can be called multiple times during countdown for pre-loading)
                setRefreshCount(c => c + 1)
                // Clear countdown on final call
                if (clearCountdown) {
                  setCountdown(null)
                }
              }}
              onPlayerJoined={() => {
                // Debounced refresh - only refresh if not already refreshing
                setRefreshCount(c => c + 1)
              }}
              onPlayerLeft={() => {
                setRefreshCount(c => c + 1)
              }}
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
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
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
                    {isGameInProgress && (
                      <div className="flex items-center gap-2 text-blue-700 font-semibold">
                        <span className="px-2 py-1 rounded bg-blue-50">Time Left: {timeLeft !== null ? `${Math.floor((timeLeft || 0) / 60)}m ${Math.max(0, (timeLeft || 0) % 60)}s` : "--"}</span>
                        <span className="px-2 py-1 rounded bg-slate-100">{room.difficulty || "medium"}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RoomActions roomId={roomId} isHost={isHost} />
                </div>
              </div>

              {/* Join prompt if not a participant */}
              {!isParticipant && (
                <div className="mb-6">
                  <RoomClient 
                    roomId={roomId} 
                    userId={currentUserId || "guest"} 
                    username={user?.username || "Player"} 
                    initialJoined={false}
                    onJoined={() => setRefreshCount(c => c + 1)}
                  />
                </div>
              )}

              {/* Room content - different UI based on status */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main area: question / code / waiting */}
                <div className="lg:col-span-2 space-y-6">
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
                            ? "Pick difficulty & duration, then start when everyone is ready." 
                            : "Waiting for the host to start the game..."}
                        </p>
                        {!isHost && participants.length < 2 && (
                          <p className="text-sm text-amber-600">Need at least 2 players to start a game.</p>
                        )}
                      </CardContent>
                    </Card>
                  ) : countdown !== null ? (
                    <Card>
                      <CardContent className="text-center py-20">
                        <div className="text-6xl font-bold text-blue-600 mb-4">{countdown}</div>
                        <p className="text-xl text-gray-600">Game starting...</p>
                      </CardContent>
                    </Card>
                  ) : isGameInProgress ? (
                    <>
                      {room.questionId || question ? (
                        <CodeEditor 
                          roomId={roomId} 
                          userId={currentUserId || "guest"}
                          username={user?.username || "Player"}
                          question={question}
                          timeLeft={timeLeft}
                        />
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

                {/* Sidebar: players, leaderboard and controls */}
                <div className="space-y-6">
                  {isGameInProgress && (
                    <LiveLeaderboard roomId={roomId} isGameActive={isGameInProgress} />
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Players</span>
                        <span className="text-xs text-gray-500">{participants.length}{room.maxPlayers ? ` / ${room.maxPlayers}` : ""}</span>
                      </CardTitle>
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

                  {isParticipant && isWaiting && (
                    <StartGameButton 
                      roomId={roomId}
                      roomName={room.name || `Room ${room.joinCode}`}
                      isHost={isHost}
                      playerCount={participants.length}
                      disabled={participants.length < 2}
                    />
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
