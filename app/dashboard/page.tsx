import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Code, Zap } from "lucide-react"
import Link from "next/link"
import { MainLayout } from "@/components/main-layout"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/")
  }

  // Fetch user's recent submissions for activity
  const recentSubmissions = await prisma.submission.findMany({
    where: {
      userId: user.id
    },
    include: {
      game: {
        include: {
          question: true
        }
      }
    },
    orderBy: { submittedAt: 'desc' },
    take: 10
  })

  // Fetch user's hosted rooms count
  const hostedRoomsCount = await prisma.room.findMany({
    where: {
      hostId: user.id,
      isActive: true
    }
  })

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {user.username}!</h1>
            <p className="text-gray-600">Your personal dashboard. Manage your rooms and track activity.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions - UNIQUE TO DASHBOARD */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Get started quickly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/rooms/create">
                  <Button className="w-full" size="lg">
                    Create New Room
                  </Button>
                </Link>
                <Link href="/rooms">
                  <Button variant="outline" className="w-full" size="lg">
                    Browse All Rooms
                  </Button>
                </Link>
                <Link href="/questions">
                  <Button variant="outline" className="w-full" size="lg">
                    Practice Problems
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Your Hosted Rooms - UNIQUE TO DASHBOARD */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Your Active Rooms
                </CardTitle>
                <CardDescription>Rooms you're hosting</CardDescription>
              </CardHeader>
              <CardContent>
                {hostedRoomsCount.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No active rooms. Create one to get started!</p>
                ) : (
                  <div className="space-y-3">
                    {hostedRoomsCount.map((room: any) => {
                      let participants: any[] = []
                      try {
                        participants = Array.isArray(room.participants) ? room.participants as any[] : JSON.parse(room.participants as string)
                      } catch {}
                      
                      return (
                        <div key={room.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{room.name || `Room ${room.joinCode}`}</h4>
                            <p className="text-sm text-gray-500">
                              {participants.length}/{room.maxPlayers} players • {room.privacy === 'private' ? '🔒 Private' : '🌍 Public'}
                            </p>
                          </div>
                          <Link href={`/rooms/${room.id}`}>
                            <Button size="sm">Manage</Button>
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity - UNIQUE TO DASHBOARD */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your recent submissions and attempts</CardDescription>
            </CardHeader>
            <CardContent>
              {recentSubmissions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent submissions. Join a room and start coding!</p>
              ) : (
                <div className="space-y-3">
                  {recentSubmissions.slice(0, 5).map((submission: any) => (
                    <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{submission.game?.question?.title || 'Untitled Question'}</h4>
                        <p className="text-sm text-gray-500">
                          {new Date(submission.submittedAt).toLocaleDateString()} {submission.isCorrect ? '✅ Correct' : '❌ Incorrect'}
                        </p>
                      </div>
                      <div className="text-sm font-medium">
                        {submission.executionTime}ms
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
