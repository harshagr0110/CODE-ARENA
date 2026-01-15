import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const room = await prisma.room.findUnique({ where: { id } })

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    let participants: any[] = []
    try {
      participants = Array.isArray(room.participants) ? room.participants as any[] : JSON.parse(room.participants as string)
    } catch {}

    // Check if there's an active game with a question
    let gameStarted = false
    if (room.status === "in_progress") {
      const activeGame = await prisma.game.findFirst({
        where: { roomId: id, endedAt: undefined }
      })
      gameStarted = !!activeGame?.questionId
    }

    const playerCount = participants.length

    return NextResponse.json({
      status: room.status,
      playerCount,
      maxPlayers: room.maxPlayers,
      gameStarted,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
