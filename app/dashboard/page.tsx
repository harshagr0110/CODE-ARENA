import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, Users, Clock, Target } from "lucide-react"
import Link from "next/link"
import { MainLayout } from "@/components/main-layout"
import { RoomActions } from "../rooms/[id]/room-actions"
import { Skeleton } from "@/components/ui/skeleton"
import { Suspense } from "react"
import { JoinByCode } from "../rooms/join-by-code"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/")
  }

  const stats = {
    totalGames: user.gamesPlayed,
    gamesWon: user.gamesWon,
    totalScore: user.totalScore,
    winRate: user.gamesPlayed > 0 ? Math.round((user.gamesWon / user.gamesPlayed) * 100) : 0,
  }

  // Fetch active rooms from database
  const allRooms = await prisma.room.findMany({
    where: {
      status: { in: ["waiting", "in_progress"] }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 20
  })

  const activeRooms = allRooms
    .filter(r => r.status === "waiting")
    .slice(0, 5)

  const userCreatedRooms = allRooms
    .filter(r => r.hostId === user.id)
    .slice(0, 5)

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user.username}!</h1>
            <p className="text-gray-600">Ready to compete? Join a room or start your own challenge.</p>
          </div>

          <div className="flex flex-col items-center mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-2xl">
              {/* Stats Skeletons */}
              {!user ? (
                <>
                  <Skeleton className="h-24 w-full mb-6" />
                  <Skeleton className="h-24 w-full mb-6" />
                  <Skeleton className="h-24 w-full mb-6" />
                </>
              ) : (
                <>
                  <Card className="bg-white shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Games</CardTitle>
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-center">{stats.totalGames}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Games Won</CardTitle>
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-center">{stats.gamesWon}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Score</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-center">{stats.totalScore}</div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
            {stats.totalGames === 0 && (
              <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <div className="flex items-center justify-center flex-col text-center">
                  <Trophy className="h-12 w-12 mb-3 text-blue-500" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Your Coding Journey</h3>
                  <p className="text-gray-600 mb-4">Compete with others, solve challenges, and climb the leaderboard!</p>
                  <div className="flex gap-3">
                    <Link href="/rooms/create">
                      <Button size="lg">Create Room</Button>
                    </Link>
                    <Link href="/rooms">
                      <Button size="lg" variant="outline">Browse Rooms</Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Start your coding journey</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/rooms/create">
                  <Button className="w-full" size="lg">
                    Create New Room
                  </Button>
                </Link>
                <Link href="/rooms">
                  <Button variant="outline" className="w-full" size="lg">
                    Browse Rooms
                  </Button>
                </Link>
                <Link href="/leaderboard">
                  <Button variant="outline" className="w-full" size="lg">
                    View Leaderboard
                  </Button>
                </Link>
                <div className="pt-4">
                  <JoinByCode />
                </div>
              </CardContent>
            </Card>
            {/* Active Rooms Skeletons */}
            {!activeRooms ? (
              <Skeleton className="h-32 w-full mb-8" />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Active Rooms</CardTitle>
                  <CardDescription>Join an ongoing competition</CardDescription>
                </CardHeader>
                <CardContent>
                  {activeRooms.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No active rooms available</p>
                  ) : (
                    <div className="space-y-3">
                      {activeRooms.map((room) => {
                        let participants: any[] = []
                        try {
                          participants = Array.isArray(room.participants) ? room.participants as any[] : JSON.parse(room.participants as string)
                        } catch {}
                        
                        return (
                          <div key={room.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <h4 className="font-medium">{room.name || `Room ${room.joinCode}`}</h4>
                              <p className="text-sm text-gray-500">
                                {participants.length}/{room.maxPlayers} players
                              </p>
                            </div>
                            <Link href={`/rooms/${room.id}`}>
                              <Button size="sm">Join</Button>
                            </Link>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {/* User Created Rooms Skeletons */}
            {!userCreatedRooms ? (
              <Skeleton className="h-32 w-full mb-8" />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Your Rooms</CardTitle>
                  <CardDescription>Manage your created rooms</CardDescription>
                </CardHeader>
                <CardContent>
                  {userCreatedRooms.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">You haven't created any rooms yet</p>
                  ) : (
                    <div className="space-y-3">
                      {userCreatedRooms.map((room: any) => {
                        let participants: any[] = []
                        try {
                          participants = Array.isArray(room.participants) ? room.participants as any[] : JSON.parse(room.participants as string)
                        } catch {}
                        
                        return (
                          <div key={room.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <h4 className="font-medium">{room.name || `Room ${room.joinCode}`}</h4>
                              <p className="text-sm text-gray-500">
                                {participants.length}/{room.maxPlayers} players • {room.status}
                              </p>
                              <p className="text-xs text-gray-400">
                                Created {new Date(room.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Link href={`/rooms/${room.id}`}>
                                <Button size="sm" variant="outline">View</Button>
                              </Link>
                              <RoomActions
                                roomId={room.id}
                                isHost={true}
                                inRoom={false}
                                size="sm"
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
