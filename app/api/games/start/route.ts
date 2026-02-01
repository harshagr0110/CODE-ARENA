import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { 
      roomId, 
      difficulty = "medium", 
      durationSeconds = 300
    } = await request.json()

    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 })
    }

    // Get room and verify user is the host
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    })

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    if (room.hostId !== user.id) {
      return NextResponse.json({ error: "Only the room host can start the game" }, { status: 403 })
    }

    if (!room.isActive) {
      return NextResponse.json({ error: "Room is not active. Game may have already ended." }, { status: 400 })
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

    if (participants.length < 2) {
      return NextResponse.json({ error: "Need at least 2 players to start" }, { status: 400 })
    }

    // Get a random question from the database based on difficulty
    const questions = await prisma.question.findMany({
      where: {
        difficulty: difficulty,
      },
    })

    if (questions.length === 0) {
      return NextResponse.json({ 
        error: `No ${difficulty} questions available. Please add some questions first.` 
      }, { status: 400 })
    }

    // Select a random question
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)]
    
    // Current timestamp for game start
    const startedAt = new Date()

    // Create a game record
    const game = await prisma.game.create({
      data: {
        roomId: roomId,
        questionId: randomQuestion.id,
        difficulty: difficulty,
        startedAt: startedAt,
        durationSeconds: durationSeconds || 300,
      }
    })

    return NextResponse.json({
      message: "Game started successfully",
      game: {
        id: game.id,
        roomId: roomId,
        questionId: randomQuestion.id,
        difficulty,
        startedAt,
        durationSeconds: durationSeconds || 300,
      },
      participants,
    })
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined,
      },
      { status: 500 },
    )
  }
}
