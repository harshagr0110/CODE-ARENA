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

    // SECURITY: Only room host can end games
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    })

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    if (room.hostId !== user.id) {
      return NextResponse.json(
        { error: "Only room host can end games" },
        { status: 403 }
      )
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

    // Idempotency check - if game already ended, return existing result
    if (game.endedAt) {
      return NextResponse.json({
        message: "Game already ended",
        winnerId: game.winnerId,
        alreadyEnded: true,
      })
    }

    // Determine winner - first person to submit correct solution
    let winner = null

    for (const submission of game.submissions) {
      if (submission.isCorrect) {
        winner = submission.user
        break
      }
    }

    // If no correct solution, winner is first to submit
    if (!winner && game.submissions.length > 0) {
      winner = game.submissions[0].user
    }

    // Parse participants from room
    let participants: any[] = []
    try {
      participants = Array.isArray(room.participants)
        ? room.participants as any[]
        : JSON.parse(room.participants as unknown as string)
    } catch (e) {
      participants = []
    }

    // Get all participant IDs from the room
    const allParticipantIds = participants.map((p: any) => p.id).filter(Boolean)

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Update game with winner
      await tx.game.update({
        where: { id: game.id },
        data: {
          winnerId: winner?.id || null,
          endedAt: new Date(),
        },
      })

      // Game ends but room stays active until host clicks "Finish Game"
      // No need to update room status here

      return {
        winnerId: winner?.id,
        winnerName: winner?.username,
      }
    })

    return NextResponse.json({
      message: "Game ended successfully",
      ...result,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
