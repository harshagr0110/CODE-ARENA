import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Code, Users, Trophy, Zap } from "lucide-react"
import Link from "next/link"
import { MainLayout } from "@/components/main-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { Suspense } from "react"

export default function HomePage() {
  return (
    <MainLayout>
      <Suspense fallback={<div className="container mx-auto px-4 py-16"><Skeleton className="h-96 w-full mb-8" /><Skeleton className="h-32 w-full mb-8" /><Skeleton className="h-32 w-full mb-8" /></div>}>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
          <div className="container mx-auto px-4 py-16">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Code Arena
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Compete in real-time coding battles. Solve problems, climb the leaderboard, and prove your skills.
              </p>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Start Competing
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Enter Arena
                  </Button>
                </Link>
              </SignedIn>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <Users className="h-8 w-8 text-green-500 mb-2" />
                  <CardTitle className="dark:text-white">Multiplayer Rooms</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="dark:text-gray-300">
                    Create or join rooms with up to 6 players. Compete in real-time coding battles.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <Code className="h-8 w-8 text-blue-500 mb-2" />
                  <CardTitle className="dark:text-white">Instant Execution</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="dark:text-gray-300">
                    Run and test your code instantly with support for multiple programming languages.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <Trophy className="h-8 w-8 text-purple-500 mb-2" />
                  <CardTitle className="dark:text-white">Leaderboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="dark:text-gray-300">
                    Track your progress, earn points, and see how you rank against other coders.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">How It Works</h3>
              <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</span>
                  </div>
                  <h4 className="text-xl font-semibold mb-2 dark:text-white">Create or Join</h4>
                  <p className="text-gray-600 dark:text-gray-300">Set up a new room or join an existing one with a code</p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">2</span>
                  </div>
                  <h4 className="text-xl font-semibold mb-2 dark:text-white">Code & Compete</h4>
                  <p className="text-gray-600 dark:text-gray-300">Solve coding challenges against other players in real-time</p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 dark:bg-purple-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">3</span>
                  </div>
                  <h4 className="text-xl font-semibold mb-2 dark:text-white">Win & Rank Up</h4>
                  <p className="text-gray-600 dark:text-gray-300">Earn points for correct solutions and climb the leaderboard</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Suspense>
    </MainLayout>
  )
}
