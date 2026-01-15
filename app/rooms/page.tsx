"use client"


import { useEffect, useState } from "react"
import { useSocket } from "@/hooks/use-socket"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Lock, Clock, Hash } from "lucide-react"
import Link from "next/link"
import { MainLayout } from "@/components/main-layout"
import { JoinByCode } from "./join-by-code"
import { RoomActions } from "./[id]/room-actions"

export default function RoomsPage() {
  const [activeRooms, setActiveRooms] = useState<any[]>([])
  const { socket } = useSocket()

  // Fetch active rooms from API (in-memory)
  const fetchRooms = async () => {
    const res = await fetch("/api/rooms/active")
    const data = await res.json()
    setActiveRooms(data.rooms || [])
  }

  useEffect(() => {
    fetchRooms()
    if (!socket) return
    socket.on("player-joined", fetchRooms)
    socket.on("player-left", fetchRooms)
    socket.on("game-started", fetchRooms)
    socket.on("game-ended", fetchRooms)
    return () => {
      socket.off("player-joined", fetchRooms)
      socket.off("player-left", fetchRooms)
      socket.off("game-started", fetchRooms)
      socket.off("game-ended", fetchRooms)
    }
  }, [socket])

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Rooms</h1>
              <p className="text-gray-600">Join an active room or create your own</p>
            </div>
            <div className="flex gap-3">
              <Link href="/rooms/create">
                <Button>Create Room</Button>
              </Link>
            </div>
          </div>

          {/* Join by Code Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Quick Join</CardTitle>
              <CardDescription>Have a room code? Enter it here to join instantly</CardDescription>
            </CardHeader>
            <CardContent>
              <JoinByCode />
            </CardContent>
          </Card>
          <div className="grid gap-6">
            {activeRooms.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active rooms</h3>
                  <p className="text-gray-500 mb-4">Join or create a coding room to get started!</p>
                  <Link href="/rooms/create">
                    <Button>Create Your First Room</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {activeRooms.map((room: any) => (
                  <Card key={room.id} className="hover:shadow-lg transition-shadow relative">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{room.name}</CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge variant={room.status === "waiting" ? "default" : "secondary"}>
                            {room.status === "waiting" ? "Waiting" : "In Progress"}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription>{room.description || "No description provided"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span>
                              {room.participants.length}/{room.maxPlayers} players
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span>{new Date(room.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Hash className="h-4 w-4 text-blue-500" />
                          <span className="font-mono text-blue-600">{room.joinCode}</span>
                        </div>
                        <div className="pt-2">
                          <Link href={`/rooms/${room.id}`}>
                            <Button
                              className="w-full bg-black text-white hover:bg-gray-900"
                              size="lg"
                            >
                              Enter Room
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
