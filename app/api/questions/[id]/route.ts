import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface Props {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const question = await prisma.question.findUnique({
      where: { id },
      include: { creator: { select: { username: true } } },
    })
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }
    
    // Ensure test cases are properly formatted
    let testCases = question.testCases
    if (typeof testCases === 'string') {
      try {
        testCases = JSON.parse(testCases)
      } catch (error) {
        testCases = []
      }
    }
    
    // Clean test cases
    if (Array.isArray(testCases)) {
      testCases = testCases.map((tc: any) => {
        if (!tc || typeof tc !== 'object') return null
        return {
          input: tc.input?.toString() || '',
          expectedOutput: tc.expectedOutput?.toString() || '',
          explanation: tc.explanation?.toString()
        }
      }).filter(Boolean)
    }
    
    const cleanedQuestion = {
      ...question,
      testCases
    }
    
    return NextResponse.json(cleanedQuestion)
  } catch (error) {
    console.error("Error fetching question:", error)
    return NextResponse.json({ error: "Failed to fetch question" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, difficulty, recommendedTimeComplexity, testCases, questionType } = await request.json()

    const existingQuestion = await prisma.question.findUnique({ where: { id } })
    if (!existingQuestion) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }
    if (existingQuestion.createdBy !== user.id) {
      return NextResponse.json({ error: "You can only edit your own questions" }, { status: 403 })
    }
    
    // Clean test cases before saving
    const cleanedTestCases = Array.isArray(testCases) 
      ? testCases.map(tc => ({
          input: tc.input?.toString() || '',
          expectedOutput: tc.expectedOutput?.toString() || '',
          explanation: tc.explanation?.toString()
        }))
      : []
    
    const updated = await prisma.question.update({
      where: { id },
      data: {
        title,
        description,
        difficulty,
        recommendedTimeComplexity,
        testCases: cleanedTestCases,
        questionType,
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating question:", error)
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const existingQuestion = await prisma.question.findUnique({ where: { id } })
    if (!existingQuestion) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }
    if (existingQuestion.createdBy !== user.id) {
      return NextResponse.json({ error: "You can only delete your own questions" }, { status: 403 })
    }
    await prisma.question.delete({ where: { id } })
    return NextResponse.json({ message: "Question deleted successfully" })
  } catch (error) {
    console.error("Error deleting question:", error)
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 })
  }
}