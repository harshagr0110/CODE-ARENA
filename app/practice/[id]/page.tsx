"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MainLayout } from "@/components/main-layout"
import { MonacoCodeEditor } from "@/components/monaco-code-editor"
import { Clock, Play, CheckCircle, XCircle, ArrowLeft, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface Question {
  id: string
  title: string
  description: string
  difficulty: string
  topics: string[]
  testCases: Array<{
    input: string
    expectedOutput: string
    explanation?: string
  }>
  creator: {
    username: string
  }
}

interface SubmissionResult {
  isCorrect: boolean
  feedback: string
  executionTime: number
  testResults: Array<{
    input: string
    expectedOutput: string
    actualOutput: string
    passed: boolean
  }>
}

interface Props {
  params: Promise<{
    id: string
  }>
}

export default function PracticeQuestionPage({ params }: Props) {
  const [question, setQuestion] = useState<Question | null>(null)
  const [code, setCode] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmissionResult | null>(null)
  const [showResult, setShowResult] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const { id } = await params
        const response = await fetch(`/api/questions/${id}`)
        if (response.ok) {
          const data = await response.json()
          setQuestion(data)
        } else {
          router.push('/questions')
        }
      } catch (error) {
        router.push('/questions')
      } finally {
        setLoading(false)
      }
    }

    fetchQuestion()
  }, [params, router])

  const normalizedTestCases = useMemo(() => {
    if (!question) return []
    const raw = Array.isArray(question.testCases)
      ? question.testCases
      : typeof question.testCases === 'string'
        ? (() => { try { return JSON.parse(question.testCases) } catch { return [] } })()
        : []
    return raw.map((tc: any) => ({
      input: tc.input || '',
      expectedOutput: tc.expectedOutput || '',
      explanation: tc.explanation || ''
    }))
  }, [question])

  const handleSubmit = async () => {
    if (!code.trim() || !question) {
      alert("Please write some code before submitting.")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/practice/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code.trim(),
          language,
          testCases: normalizedTestCases
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit code")
      }

      setResult(data)
      setShowResult(true)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Submission failed")
    } finally {
      setSubmitting(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isSigsegvError = (output: string) => {
    return output.includes('SIGSEGV') || output.includes('Segmentation Fault')
  }

  const isCompilationError = (output: string) => {
    return output.includes('Compilation Error') || 
           output.includes('syntax error') ||
           output.includes('compilation failed')
  }

  const isRuntimeError = (output: string) => {
    return output.includes('Runtime Error') || 
           output.includes('crashed') ||
           output.includes('Time Limit Exceeded') ||
           output.includes('Memory Limit Exceeded')
  }

  const isSystemError = (output: string) => {
    return output.includes('Execution Error') || 
           output.includes('Unknown error')
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-500">Loading question...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!question) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Problem not found</h3>
              <Link href="/questions">
                <Button>Back to Problems</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link href="/questions">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Problems
              </Button>
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Problem Description */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{question.title}</CardTitle>
                    <Badge className={getDifficultyColor(question.difficulty)}>
                      {question.difficulty}
                    </Badge>
                  </div>
                  {question.topics && question.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {question.topics.map((topic) => (
                        <Badge key={topic} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{question.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Examples */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Examples</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {normalizedTestCases.slice(0, 2).map((testCase: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Example {index + 1}:</h4>
                        <div className="space-y-2 text-sm">
                          {testCase.input && (
                            <div>
                              <span className="font-medium">Input:</span>
                              <pre className="bg-white p-2 rounded mt-1 overflow-x-auto whitespace-pre-wrap">{testCase.input}</pre>
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Output:</span>
                            <pre className="bg-white p-2 rounded mt-1 overflow-x-auto whitespace-pre-wrap">{testCase.expectedOutput}</pre>
                          </div>
                          {testCase.explanation && (
                            <div>
                              <span className="font-medium">Explanation:</span>
                              <p className="mt-1">{testCase.explanation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {normalizedTestCases.length > 2 && (
                      <p className="text-sm text-gray-600">
                        {normalizedTestCases.length - 2} additional test case{normalizedTestCases.length - 2 === 1 ? '' : 's'} hidden; all cases run after you submit.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Results */}
              {showResult && result && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      {result.isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      {result.isCorrect ? "Accepted" : "Wrong Answer"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm">{result.feedback}</p>
                      
                      <div className="text-sm">
                        <span className="font-medium">Execution Time:</span> {result.executionTime}ms
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Test Results:</h4>
                        {result.testResults.map((test, index) => (
                          <div key={index} className={`p-3 rounded-lg ${test.passed ? 'bg-green-50' : 'bg-red-50'}`}>
                            <div className="flex items-center mb-2">
                              {test.passed ? (
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500 mr-2" />
                              )}
                              <span className="font-medium">Test Case {index + 1}</span>
                            </div>
                            {!test.passed && (
                              <div className="space-y-2">
                                {isSigsegvError(test.actualOutput) && (
                                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                                    <div className="flex items-center mb-2">
                                      <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                                      <span className="font-medium text-yellow-800">Common Issue</span>
                                    </div>
                                    <p className="text-sm text-yellow-700">
                                      This error usually means your code tried to access memory it doesn't have permission to access. 
                                      Check your array/vector bounds and make sure you're not accessing elements beyond the allocated size.
                                    </p>
                                  </div>
                                )}
                                {isCompilationError(test.actualOutput) && (
                                  <div className="bg-red-50 border border-red-200 rounded p-3">
                                    <div className="flex items-center mb-2">
                                      <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                                      <span className="font-medium text-red-800">Compilation Error</span>
                                    </div>
                                    <p className="text-sm text-red-700">
                                      Your code has a compilation error. Please check your syntax and fix it.
                                    </p>
                                  </div>
                                )}
                                {isRuntimeError(test.actualOutput) && (
                                  <div className="bg-red-50 border border-red-200 rounded p-3">
                                    <div className="flex items-center mb-2">
                                      <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                                      <span className="font-medium text-red-800">Runtime Error</span>
                                    </div>
                                    <p className="text-sm text-red-700">
                                      Your code crashed or encountered an error during execution.
                                    </p>
                                  </div>
                                )}
                                {isSystemError(test.actualOutput) && (
                                  <div className="bg-orange-50 border border-orange-200 rounded p-3">
                                    <div className="flex items-center mb-2">
                                      <AlertTriangle className="h-4 w-4 text-orange-600 mr-2" />
                                      <span className="font-medium text-orange-800">System Error</span>
                                    </div>
                                    <p className="text-sm text-orange-700">
                                      There was an issue with the execution environment. Please try again.
                                    </p>
                                  </div>
                                )}
                                <div className="text-sm space-y-1">
                                  {test.input && <div><span className="font-medium">Input:</span> <pre className="whitespace-pre-wrap">{test.input}</pre></div>}
                                  <div><span className="font-medium">Expected:</span> <pre className="whitespace-pre-wrap">{test.expectedOutput}</pre></div>
                                  <div><span className="font-medium">Got:</span> <pre className="whitespace-pre-wrap">{test.actualOutput}</pre></div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Code Editor */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Solution</CardTitle>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <label className="text-sm font-medium">Language:</label>
                      <select 
                        value={language} 
                        onChange={(e) => setLanguage(e.target.value)}
                        className="border rounded px-3 py-2"
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="cpp">C++</option>
                        <option value="java">Java</option>
                        <option value="c">C</option>
                      </select>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-2">
                    <div className="flex items-center mb-1">
                      <AlertTriangle className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="font-medium text-blue-800">Code Execution</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Your code will be executed using Judge0 API. Make sure to read input from stdin and output to stdout.
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <MonacoCodeEditor
                      value={code}
                      onChange={setCode}
                      language={language}
                      height="400px"
                    />

                    <Button 
                      onClick={handleSubmit} 
                      disabled={submitting || !code.trim()} 
                      className="w-full" 
                      size="lg"
                    >
                      {submitting ? (
                        "Running..."
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Submit Solution
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}