import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, difficulty, testCases, topics } = body

    if (!title || !description || !testCases || !Array.isArray(testCases)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate and clean test cases - allow empty input but not empty expectedOutput
    const cleanedTestCases = testCases
      .filter((testCase: any) => testCase && testCase.expectedOutput !== undefined && testCase.expectedOutput !== null)
      .map((testCase: any) => ({
        input: testCase.input !== undefined && testCase.input !== null ? testCase.input.toString() : '',
        expectedOutput: testCase.expectedOutput.toString().trim(),
        explanation: testCase.explanation?.toString().trim() || undefined
      }))
      .filter((testCase: any) => testCase.expectedOutput.length > 0) // Only filter out empty expectedOutput

    if (cleanedTestCases.length === 0) {
      return NextResponse.json({ error: "At least one valid test case is required" }, { status: 400 })
    }

    const safeTopics: string[] = Array.isArray(topics)
      ? topics.map((t: any) => (typeof t === 'string' ? t : String(t))).slice(0, 10)
      : []

    const question = await prisma.question.create({
      data: {
        title,
        description,
        difficulty: difficulty || "medium",
        topics: safeTopics,
        testCases: cleanedTestCases,
        createdBy: user.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
        topics: true,
      },
    })

    return NextResponse.json(question)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Public browsing of questions
    const questions = await prisma.question.findMany({
      orderBy: { id: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
        topics: true,
      }
    })

    return NextResponse.json(questions)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 })
  }
}