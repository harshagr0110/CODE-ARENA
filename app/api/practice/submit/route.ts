import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { executeCode } from "@/lib/piston"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { code, language, testCases } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: "Code is required" }, { status: 400 })
    }

    if (!language || typeof language !== 'string') {
      return NextResponse.json({ error: "Language is required" }, { status: 400 })
    }

    if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
      return NextResponse.json({ error: "At least one test case is required" }, { status: 400 })
    }

    // Clean and validate test cases
    const cleanTestCases = testCases
      .filter(testCase => testCase && testCase.expectedOutput)
      .map(testCase => ({
        input: testCase.input?.toString() || '',
        expectedOutput: testCase.expectedOutput.toString(),
        explanation: testCase.explanation?.toString()
      }))

    if (cleanTestCases.length === 0) {
      return NextResponse.json({ error: "No valid test cases found" }, { status: 400 })
    }

    const result = await executeCode(code, language, cleanTestCases)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Code execution failed" }, 
      { status: 500 }
    )
  }
}