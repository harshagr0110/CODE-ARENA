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
    if (!code) return NextResponse.json({ error: "Code is required" }, { status: 400 })
    
    // Support both multiplayer (roomId) and practice (questionId) modes
    if (!roomId && !questionId) {
      return NextResponse.json({ error: "Either roomId (multiplayer) or questionId (practice) is required" }, { status: 400 })
    }

    // Get room with current game (for multiplayer mode)
    let room = null
    let game = null
    let qId = questionId
    
    if (roomId) {
      room = await prisma.room.findUnique({ 
        where: { id: roomId }
      })
      
      if (!room || !room.isActive) {
        return NextResponse.json({ error: "Room is not active" }, { status: 400 })
      }
      
      // Get current game
      game = await prisma.game.findFirst({
        where: {
          roomId: roomId,
          endedAt: null
        }
      })
      
      if (!game) {
        return NextResponse.json({ error: "No active game found" }, { status: 400 })
      }
      
      // CRITICAL: Prevent submissions after game has ended
      if (game.endedAt) {
        return NextResponse.json({ error: "Game has already ended" }, { status: 403 })
      }
      
      qId = game.questionId
    } else if (questionId) {
      // Practice mode - directly use questionId
      qId = questionId
    }

    // Prevent duplicate submissions only for multiplayer mode
    if (game) {
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
    }
    
    // Get question
    const qId_Final = qId || game?.questionId
    if (!qId_Final) {
      return NextResponse.json({ error: "No question associated with this submission" }, { status: 400 })
    }
    
    const question = await prisma.question.findUnique({
      where: { id: qId_Final }
    })
    
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 400 })
    }

    let evaluation: {
      isCorrect: boolean;
      feedback: string;
      executionTime: number;
      testResults: any[];
    } = {
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
          testResults: result.testResults || [],
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

    // Create or update submission in database (only for multiplayer mode with game)
    // Practice mode doesn't create submission records (use /api/practice/submit instead)
    let submission = null
    if (game) {
      let existingSubmission = await prisma.submission.findFirst({
        where: {
          gameId: game.id,
          userId: user.id
        }
      })
      
      submission = existingSubmission
        ? await prisma.submission.update({
            where: { id: existingSubmission.id },
            data: {
              code: code.trim(),
              language,
              isCorrect: evaluation.isCorrect,
              feedback: evaluation.feedback,
              testResults: evaluation.testResults && evaluation.testResults.length > 0 ? (evaluation.testResults as any) : undefined,
              executionTime: evaluation.executionTime,
              submittedAt: new Date(),
            }
          })
        : await prisma.submission.create({
            data: {
              gameId: game.id,
              userId: user.id,
              questionId: qId_Final,
              code: code.trim(),
              language,
              isCorrect: evaluation.isCorrect,
              feedback: evaluation.feedback,
              testResults: evaluation.testResults && evaluation.testResults.length > 0 ? (evaluation.testResults as any) : undefined,
              executionTime: evaluation.executionTime,
            }
          })
    }

    // For multiplayer only: Check for winners
    let shouldEndGame = false
    let winnerData = null

    if (game && !game.endedAt) { // CRITICAL: Only process if game not already ended
      // Check if this is the first correct submission (instant winner)
      if (evaluation.isCorrect) {
        const gameWithSubmissions = await prisma.game.findUnique({
          where: { id: game.id },
          include: {
            submissions: {
              where: { isCorrect: true },
              orderBy: { submittedAt: 'asc' },
              include: { user: true },
              take: 1
            }
          }
        })

        // Only if this is the FIRST correct submission and it's from current user
        const wasFirst = gameWithSubmissions?.submissions.length === 1 && gameWithSubmissions?.submissions[0].userId === user.id
        
        if (wasFirst) {
          shouldEndGame = true
          winnerData = {
            winnerId: user.id,
            winnerName: user.username || 'Anonymous'
          }
          
          // End the game atomically with optimistic locking - only update if not already ended
          try {
            await prisma.game.update({
              where: { id: game.id, endedAt: null }, // Only update if not already ended
              data: {
                winnerId: user.id,
                endedAt: new Date()
              }
            })
          } catch (e) {
            // Game already ended by another submission, don't process as winner
            shouldEndGame = false
          }
        }
      }
      
      // If no winner yet, check if all players have submitted
      if (!shouldEndGame) {
        let participants: any[] = []
        try {
          participants = Array.isArray(room?.participants)
            ? (room?.participants as any[])
            : JSON.parse(room?.participants as unknown as string)
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
          
          // Find winner (first person to submit correct, else first to submit)
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
          
          // End game atomically
          await prisma.game.update({
            where: { id: game.id },
            data: {
              winnerId: correctSubmission?.userId || null,
              endedAt: new Date()
            }
          })
        }
      }
    }

    // End game if needed - let socket server or explicit game-end handle it
    // Removed redundant fetch call to prevent race conditions
    // The socket server timer or explicit game-end call will handle ending

    return NextResponse.json({
      message: "Submission evaluated successfully",
      submission: submission ? {
        id: submission.id,
        userId: submission.userId,
        isCorrect: submission.isCorrect,
        feedback: submission.feedback,
        testResults: submission.testResults || [],
        executionTime: submission.executionTime,
        submittedAt: submission.submittedAt
      } : {
        isCorrect: evaluation.isCorrect,
        feedback: evaluation.feedback,
        testResults: evaluation.testResults || [],
        executionTime: evaluation.executionTime,
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
