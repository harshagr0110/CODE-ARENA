import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: roomId } = await params

    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 })
    }

    // Verify the user is the host of the room
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    })

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    if (room.hostId !== user.id) {
      return NextResponse.json(
        { error: "Only the room host can finish the game" },
        { status: 403 }
      )
    }

    // Delete all related data in the correct order to respect foreign key constraints
    await prisma.$transaction(async (tx) => {
      // Delete all submissions for games in this room
      const games = await tx.game.findMany({
        where: { roomId: roomId },
        select: { id: true }
      })

      for (const game of games) {
        await tx.submission.deleteMany({
          where: { gameId: game.id }
        })
      }

      // Delete all games for this room
      await tx.game.deleteMany({
        where: { roomId: roomId }
      })

      // Delete the room
      await tx.room.delete({
        where: { id: roomId }
      })
    })

    return NextResponse.json({
      message: "Room and all related data deleted successfully",
    })
  } catch (error) {
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
