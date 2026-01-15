import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { roomId } = await request.json()

    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 })
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    })

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    // Get active game with all submissions
    const game = await prisma.game.findFirst({
      where: {
        roomId: roomId,
        endedAt: null,
      },
      include: {
        submissions: {
          include: { user: true },
          orderBy: { submittedAt: 'asc' },
        },
      },
    })

    if (!game) {
      return NextResponse.json({ error: "No active game found" }, { status: 400 })
    }

    // Determine winner - first person to submit correct solution
    let winner = null
    let winnerScore = 0

    for (const submission of game.submissions) {
      if (submission.isCorrect) {
        winner = submission.user
        winnerScore = submission.score
        break
      }
    }

    // If no correct solution, winner is person with highest score
    if (!winner && game.submissions.length > 0) {
      const best = game.submissions.reduce((prev, curr) =>
        curr.score > prev.score ? curr : prev
      )
      winner = best.user
      winnerScore = best.score
    }

    // Update game with winner
    await prisma.game.update({
      where: { id: game.id },
      data: {
        winnerId: winner?.id || null,
        endedAt: new Date(),
      },
    })

    // Update room status
    await prisma.room.update({
      where: { id: roomId },
      data: {
        status: "finished",
        endedAt: new Date(),
      },
    })

    // Update user stats
    if (winner) {
      // Winner gets points based on score
      await prisma.user.update({
        where: { id: winner.id },
        data: {
          totalScore: { increment: winnerScore },
          gamesPlayed: { increment: 1 },
          gamesWon: { increment: 1 },
        },
      }).catch(() => {/* Silent fail */})
    }

    // Update all participants
    const allParticipants = game.submissions.map(s => s.userId)
    const uniqueParticipants = [...new Set(allParticipants)]

    for (const participantId of uniqueParticipants) {
      if (participantId !== winner?.id) {
        await prisma.user.update({
          where: { id: participantId },
          data: { gamesPlayed: { increment: 1 } },
        }).catch(() => {/* Silent fail */})
      }
    }

    return NextResponse.json({
      message: "Game ended successfully",
      winnerId: winner?.id,
      winnerName: winner?.username,
      winnerScore,
    })
  } catch (error) {
    console.error("Error ending game:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
