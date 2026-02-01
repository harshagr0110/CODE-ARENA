import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface Props {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    // Standardized participant parsing
    let participants: any[] = []
    try {
      participants = Array.isArray(room.participants)
        ? (room.participants as any[])
        : JSON.parse(room.participants as unknown as string)
    } catch (e) {
      participants = []
    }
    const maxPlayers = typeof room.maxPlayers === "number" ? room.maxPlayers : 10
    if (participants.length >= maxPlayers) {
      return NextResponse.json({ error: "Room is full" }, { status: 400 })
    }
    if (!room.isActive) {
      return NextResponse.json({ error: "Room is not active" }, { status: 400 })
    }
    const alreadyInRoom = participants.some((p: any) => p.id === user.id)
    if (alreadyInRoom) {
      return NextResponse.json({ message: "Already in room" })
    }
    participants.push({ id: user.id, username: user.username })
    await prisma.room.update({ where: { id }, data: { participants } })
    return NextResponse.json({ message: "Joined room successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    // Standardized participant parsing
    let participants: any[] = []
    try {
      participants = Array.isArray(room.participants)
        ? (room.participants as any[])
        : JSON.parse(room.participants as unknown as string)
    } catch (e) {
      participants = []
    }
    
    // Check if user is in the room
    const isParticipant = participants.some((p: any) => p.id === user.id)
    const isHost = room.hostId === user.id
    
    // Get the active game record for additional data
    const activeGame = await prisma.game.findFirst({
      where: {
        roomId: id,
        endedAt: null
      },
      orderBy: { startedAt: 'desc' }
    })
    
    // Fetch question data if there's an active game
    let questionData = null
    if (activeGame?.questionId) {
      try {
        questionData = await prisma.question.findUnique({
          where: { id: activeGame.questionId }
        })
      } catch (e) {
        // Silent fail
      }
    }
    
    // Return room data with all necessary info
    return NextResponse.json({ 
      ...room, 
      participants,
      isParticipant,
      isHost,
      question: questionData,
      questionId: activeGame?.questionId ?? (room as any).questionId,
      gameId: activeGame?.id,
      startedAt: activeGame?.startedAt ?? (room as any).startedAt ?? null,
      durationSeconds: activeGame?.durationSeconds ?? 300,
      difficulty: activeGame?.difficulty ?? (room as any).difficulty ?? "medium",
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    if (room.hostId !== user.id) {
      return NextResponse.json({ error: "Only the room host can delete the room" }, { status: 403 })
    }
    await prisma.room.delete({ where: { id } })
    return NextResponse.json({ message: "Room deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete room" }, { status: 500 })
  }
}
