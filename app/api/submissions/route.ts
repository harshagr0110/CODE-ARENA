import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { executeCode } from "@/lib/piston"
import { prisma } from "@/lib/prisma"

interface TestCase {
  input: string
  expectedOutput: string
  explanation?: string
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
    
    if (!room || room.status !== "in_progress") {
      return NextResponse.json({ error: "Room not found or game not active" }, { status: 400 })
    }
    
    // Get current game
    const game = await prisma.game.findFirst({
      where: {
        roomId: roomId,
        endedAt: undefined
      }
    })
    
    if (!game) {
      return NextResponse.json({ error: "No active game found" }, { status: 400 })
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

    // Calculate score based on correctness, execution time, and code length
    let score = 0
    let codeLength = code.trim().length

    if (evaluation.isCorrect) {
      // Base score for correct solution
      score = 100

      // Speed bonus: up to 30 points for fast execution
      if (evaluation.executionTime < 100) {
        score += 30 // Perfect speed
      } else if (evaluation.executionTime < 500) {
        score += 20 // Good speed
      } else if (evaluation.executionTime < 1000) {
        score += 10 // Acceptable speed
      }

      // Code quality: slight bonus for concise code (max 10 points)
      if (codeLength < 200) {
        score += Math.min(10, Math.floor((200 - codeLength) / 20))
      }
    } else {
      // Partial credit for incorrect solutions
      // Check if code at least compiles/runs
      if (evaluation.feedback !== "Code execution failed") {
        score = 20 // Partial credit for attempt
      }
    }

    // Create submission in database
    const submission = await prisma.submission.create({
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
        score: score,
      }
    })

    // Emit real-time update
    // TODO: Emit real-time update via Socket.io server (implement in socket-server.js)
    // socket.emit('submission-update', { roomId, userId, result, score, timestamp })

    return NextResponse.json({
      message: "Submission evaluated successfully",
      submission: {
        id: submission.id,
        userId: submission.userId,
        isCorrect: submission.isCorrect,
        score: submission.score,
        feedback: submission.feedback,
        executionTime: submission.executionTime
      },
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
