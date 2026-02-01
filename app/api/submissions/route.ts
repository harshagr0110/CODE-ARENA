import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { executeCode } from "@/lib/piston"
import { prisma } from "@/lib/prisma"

interface TestCase {
  input: string
  expectedOutput: string
  explanation?: string
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get("gameId")
    const roomId = searchParams.get("roomId")

    if (!gameId && !roomId) {
      return NextResponse.json({ error: "gameId or roomId required" }, { status: 400 })
    }

    const where: any = {}
    if (gameId) where.gameId = gameId
    if (roomId) {
      // Find active game for room
      const game = await prisma.game.findFirst({
        where: { roomId, endedAt: null },
        select: { id: true }
      })
      if (game) where.gameId = game.id
    }

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: [
        { isCorrect: 'desc' },
        { submittedAt: 'asc' }
      ]
    })

    return NextResponse.json(submissions)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { roomId, code, language = "javascript", feedback, isCorrect, questionId } = await request.json()
    if (!roomId || !code) return NextResponse.json({ error: "Room ID and code are required" }, { status: 400 })

    // Get room with current game
    const room = await prisma.room.findUnique({ 
      where: { id: roomId }
    })
    
    if (!room || !room.isActive) {
      return NextResponse.json({ error: "Room is not active" }, { status: 400 })
    }
    
    // Get current game
    const game = await prisma.game.findFirst({
      where: {
        roomId: roomId,
        endedAt: null
      }
    })
    
    if (!game) {
      return NextResponse.json({ error: "No active game found" }, { status: 400 })
    }

    // Prevent duplicate submissions only if user already solved correctly
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        gameId: game.id,
        userId: user.id
      }
    })

    if (existingSubmission && existingSubmission.isCorrect) {
      return NextResponse.json({ 
        error: "You have already submitted a correct solution for this game",
        submission: {
          id: existingSubmission.id,
          isCorrect: existingSubmission.isCorrect
        }
      }, { status: 409 })
    }
    
    // Get question
    const qId = questionId || game.questionId
    if (!qId) {
      return NextResponse.json({ error: "No question associated with this game" }, { status: 400 })
    }
    
    const question = await prisma.question.findUnique({
      where: { id: qId }
    })
    
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 400 })
    }

    let evaluation = {
      isCorrect: false,
      feedback: "",
      executionTime: 0,
      testResults: []
    };
    
    if (feedback === 'disqualified') {
      evaluation = {
        isCorrect: false,
        feedback: 'disqualified',
        executionTime: 0,
        testResults: [],
      }
    } else {
      try {
        // Parse test cases
        let testCases: TestCase[] = []
        if (typeof question.testCases === 'string') {
          testCases = JSON.parse(question.testCases)
        } else if (Array.isArray(question.testCases)) {
          testCases = question.testCases as unknown as TestCase[]
        }
        
        // Execute code against test cases
        const result = await executeCode(code, language, testCases);
        
        evaluation = {
          isCorrect: result.isCorrect || false,
          feedback: result.feedback || "Code submitted",
          executionTime: result.executionTime || 0,
          testResults: [],
        };
      } catch (error) {
        evaluation = {
          isCorrect: false,
          feedback: "Code execution failed",
          executionTime: 0,
          testResults: [],
        };
      }
    }

    // Create or update submission in database (allow resubmissions if incorrect)
    const submission = existingSubmission
      ? await prisma.submission.update({
          where: { id: existingSubmission.id },
          data: {
            code: code.trim(),
            language,
            isCorrect: evaluation.isCorrect,
            feedback: evaluation.feedback,
            executionTime: evaluation.executionTime,
            submittedAt: new Date(),
          }
        })
      : await prisma.submission.create({
          data: {
            id: crypto.randomUUID(),
            gameId: game.id,
            userId: user.id,
            questionId: game.questionId,
            code: code.trim(),
            language,
            isCorrect: evaluation.isCorrect,
            feedback: evaluation.feedback,
            executionTime: evaluation.executionTime,
          }
        })

    // Check if this is the first correct submission (instant winner)
    const correctSubmissions = await prisma.submission.findMany({
      where: {
        gameId: game.id,
        isCorrect: true
      },
      orderBy: {
        submittedAt: 'asc'
      },
      include: {
        user: true
      }
    })

    let shouldEndGame = false
    let winnerData = null

    // If this is the first correct submission, declare winner immediately
    if (evaluation.isCorrect && correctSubmissions.length === 1 && correctSubmissions[0].userId === user.id) {
      shouldEndGame = true
      winnerData = {
        winnerId: user.id,
        winnerName: user.username || 'Anonymous'
      }
    } else {
      // Check if all players have submitted (end game even without correct answers)
      // Standardized participant parsing
      let participants: any[] = []
      try {
        participants = Array.isArray(room.participants)
          ? (room.participants as any[])
          : JSON.parse(room.participants as unknown as string)
      } catch (e) {
        participants = []
      }

      const allSubmissions = await prisma.submission.findMany({
        where: { gameId: game.id },
        select: { userId: true },
        distinct: ['userId']
      })

      const uniqueSubmitters = allSubmissions.map(s => s.userId)
      const allPlayersSubmitted = participants.every((p: any) => {
        const participantId = p?.id
        return participantId && uniqueSubmitters.includes(participantId)
      })

      if (allPlayersSubmitted) {
        shouldEndGame = true
        
        // Find winner (first person to submit correct, else last to submit)
        const correctSubmission = await prisma.submission.findFirst({
          where: { gameId: game.id, isCorrect: true },
          orderBy: { submittedAt: 'asc' },
          include: { user: true }
        })

        if (correctSubmission) {
          winnerData = {
            winnerId: correctSubmission.userId,
            winnerName: correctSubmission.user.username || 'Anonymous',
          }
        }
      }
    }

    // End game if needed - let socket server or explicit game-end handle it
    // Removed redundant fetch call to prevent race conditions
    // The socket server timer or explicit game-end call will handle ending

    return NextResponse.json({
      message: "Submission evaluated successfully",
      submission: {
        id: submission.id,
        userId: submission.userId,
        isCorrect: submission.isCorrect,
        feedback: submission.feedback,
        executionTime: submission.executionTime,
        submittedAt: submission.submittedAt
      },
      shouldEndGame: shouldEndGame,
      winner: winnerData
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: "Code execution failed",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}
