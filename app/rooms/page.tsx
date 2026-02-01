"use client"

import { useEffect, useState } from "react"
import { useSocket } from "@/hooks/use-socket"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Lock, Globe, Hash } from "lucide-react"
import Link from "next/link"
import { MainLayout } from "@/components/main-layout"
import { JoinByCode } from "./join-by-code"

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([])
  const { socket } = useSocket()

  // Fetch active rooms from API
  const fetchRooms = async () => {
    try {
      const res = await fetch("/api/rooms/active")
      const data = await res.json()
      setRooms(data.rooms || [])
    } catch (error) {
    }
  }

  useEffect(() => {
    fetchRooms()
    if (!socket) return
    
    // Debounce room fetches
    let timeoutId: NodeJS.Timeout
    const debouncedFetch = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(fetchRooms, 500)
    }
    
    socket.on("player-joined", debouncedFetch)
    socket.on("player-left", debouncedFetch)
    socket.on("game-started", debouncedFetch)
    
    return () => {
      clearTimeout(timeoutId)
      socket.off("player-joined", debouncedFetch)
      socket.off("player-left", debouncedFetch)
      socket.off("game-started", debouncedFetch)
    }
  }, [socket])

  // Separate rooms by privacy and status
  const publicRooms = rooms.filter(r => r.privacy === 'public' && r.isActive)
  const privateRooms = rooms.filter(r => r.privacy === 'private' && r.isActive)

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Rooms</h1>
              <p className="text-gray-600">Join public rooms or enter a private room code</p>
            </div>
            <Link href="/rooms/create">
              <Button size="lg">Create Room</Button>
            </Link>
          </div>

          {/* Join Private Room Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-500" />
                Join Private Room
              </CardTitle>
              <CardDescription>Have a private room code? Join using it</CardDescription>
            </CardHeader>
            <CardContent>
              <JoinByCode />
            </CardContent>
          </Card>

          {/* Public Rooms Section */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Globe className="h-6 w-6 text-green-500" />
                Public Rooms
              </h2>
              <p className="text-gray-600">Open to everyone - join anytime!</p>
            </div>

            {publicRooms.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No public rooms available</h3>
                  <p className="text-gray-500 mb-4">Create a public room to get started!</p>
                  <Link href="/rooms/create">
                    <Button>Create Public Room</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {publicRooms.map((room: any) => {
                  let participants: any[] = []
                  try {
                    participants = Array.isArray(room.participants) ? room.participants as any[] : JSON.parse(room.participants as string)
                  } catch {}
                  
                  const isFull = participants.length >= room.maxPlayers

                  return (
                    <Card key={room.id} className={`hover:shadow-lg transition-shadow ${isFull ? 'opacity-60' : ''}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{room.name || `Room ${room.joinCode}`}</CardTitle>
                          <Globe className="h-5 w-5 text-green-500" />
                        </div>
                        <CardDescription>Created {new Date(room.createdAt).toLocaleDateString()}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-500" />
                              <span>{participants.length}/{room.maxPlayers} players</span>
                            </div>
                            <Badge variant={participants.length >= room.maxPlayers ? "secondary" : "default"}>
                              {participants.length >= room.maxPlayers ? "Full" : "Open"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Hash className="h-4 w-4" />
                            <code className="font-mono text-blue-600">{room.joinCode}</code>
                          </div>
                        </div>
                        <Link href={`/rooms/${room.id}`} className="block">
                          <Button 
                            className="w-full" 
                            disabled={isFull}
                          >
                            {isFull ? "Room Full" : "Enter Room"}
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Private Rooms Section */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Lock className="h-6 w-6 text-purple-500" />
                Active Private Rooms
              </h2>
              <p className="text-gray-600">You'll need the room code to join</p>
            </div>

            {privateRooms.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500">No private rooms visible. Use the code above to join a private room.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {privateRooms.map((room: any) => {
                  let participants: any[] = []
                  try {
                    participants = Array.isArray(room.participants) ? room.participants as any[] : JSON.parse(room.participants as string)
                  } catch {}

                  return (
                    <Card key={room.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{room.name || `Room ${room.joinCode}`}</CardTitle>
                          <Lock className="h-5 w-5 text-purple-500" />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="h-4 w-4" />
                            <span>{participants.length}/{room.maxPlayers} players</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Hash className="h-4 w-4" />
                            <code className="font-mono text-blue-600">{room.joinCode}</code>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">Use the code above to join via "Join Private Room"</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
