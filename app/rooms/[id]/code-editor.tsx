"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSocket } from "@/hooks/use-socket"
import { toast } from "sonner"
import { MonacoCodeEditor } from "@/components/monaco-code-editor"
import { Send, Loader2 } from "lucide-react"
import { QuestionDisplay } from "./question-display"

interface CodeEditorProps {
  roomId: string
  userId: string
  username?: string
  question?: any
  timeLeft?: number | null
}

// Default code templates for each language
const DEFAULT_CODE_TEMPLATES = {
  javascript: `// JavaScript solution
const input = [];
require('readline')
  .createInterface(process.stdin, process.stdout)
  .on('line', line => input.push(line))
  .on('close', () => {
    // Your code here
  });`,

  python: `# Python solution
import sys

# Your code here`,

  cpp: `#include <iostream>
using namespace std;

int main() {
    // Your code here
    return 0;
}`,

  java: `import java.util.*;

class Solution {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Your code here
        scanner.close();
    }
}`,

  c: `#include <stdio.h>

int main() {
    // Your code here
    return 0;
}`
};

export function CodeEditor({ roomId, userId, username = "Player", question: initialQuestion, timeLeft: parentTimeLeft }: CodeEditorProps) {
  const [language, setLanguage] = useState("javascript")
  const [code, setCode] = useState(DEFAULT_CODE_TEMPLATES.javascript)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [disqualified, setDisqualified] = useState(false)
  const [mode, setMode] = useState('normal')
  const [question, setQuestion] = useState<any>(initialQuestion)
  const [timeLeft, setTimeLeft] = useState<number | null>(parentTimeLeft ?? null)
  const lastLengthRef = useRef(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const autoSubmittedRef = useRef(false)
  const router = useRouter()
  const { socket, isConnected } = useSocket()

  // Function to handle language changes
  const handleLanguageChange = (newLang: keyof typeof DEFAULT_CODE_TEMPLATES) => {
    setLanguage(newLang);
    setCode(DEFAULT_CODE_TEMPLATES[newLang]);
  };

  useEffect(() => {
    // Use question passed from parent instead of fetching again
    if (initialQuestion) {
      setQuestion(initialQuestion);
    }
  }, [initialQuestion])

  // Sync timeLeft from parent
  useEffect(() => {
    if (parentTimeLeft !== undefined) {
      setTimeLeft(parentTimeLeft)
    }
  }, [parentTimeLeft])
  
  // Cleanup the timer when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [])

  // Simplified continuous write mode - check if code is being written
  useEffect(() => {
    if (mode !== 'contwrite' || submitted) return

    let lastLength = code.length

    const interval = setInterval(() => {
      if (code.length > lastLength) {
        lastLength = code.length
      } else {
        // Code length not increasing = disqualified
        setDisqualified(true)
        clearInterval(interval)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [mode, submitted, code.length])

  // Handle auto-submission when timer expires
  const handleAutoSubmit = async () => {
    if (submitted || autoSubmittedRef.current) return
    autoSubmittedRef.current = true

    try {
      setLoading(true)

      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          code: code.trim() || "// Time expired - no solution submitted",
          language,
          questionId: question?.id,
          timeExpired: true,
        }),
      })

      // Emit socket event for submission
      if (socket && isConnected) {
        socket.emit("code-submitted", { roomId, userId, username, isCorrect: false })
      }

      setSubmitted(true)
      // Don't navigate here - let the socket time-expired event or page timer handle it
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  // Watch for timeLeft reaching 0 and auto-submit
  useEffect(() => {
    if (timeLeft === 0 && !submitted && !autoSubmittedRef.current && question) {
      handleAutoSubmit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, submitted, question])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) {
      alert("Please write some code before submitting.")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          code: code.trim(),
          language,
          questionId: question?.id,
        }),
      })

      const submissionData = await response.json()

      if (!response.ok) {
        toast.error(submissionData?.error || "Submission failed")
        return
      }

      // Emit socket event with isCorrect flag
      if (socket && isConnected) {
        socket.emit("code-submitted", {
          roomId,
          userId,
          username,
          isCorrect: submissionData.submission?.isCorrect,
        })

        // If game ended with a winner, emit winner-announced event
        if (submissionData.shouldEndGame && submissionData.winner) {
          socket.emit("game-winner", {
            roomId,
            winnerId: submissionData.winner.winnerId,
            winnerName: submissionData.winner.winnerName,
          })
        }
      }

      if (submissionData.submission?.isCorrect) {
        toast.success("✅ Correct solution!")
        setSubmitted(true)

        // If game ended, navigate to results after short delay
        if (submissionData.shouldEndGame) {
          setTimeout(() => {
            router.push(`/rooms/${roomId}/results`)
          }, 2000)
        }
      } else {
        toast.error(submissionData.submission?.feedback || "❌ Incorrect solution")
      }
    } catch (error) {
      toast.error("Submission failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (disqualified) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <h3 className="text-lg font-medium text-red-600 mb-2">❌ Disqualified!</h3>
          <p className="text-gray-600">You stopped typing for too long in Continuous Writing mode. You cannot submit or edit code anymore.</p>
        </CardContent>
      </Card>
    )
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900 mb-2">✅ Solution Submitted!</h3>
          <p className="text-gray-600">You can now watch other players compete.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Display the question */}
      <QuestionDisplay question={question} timeLeft={timeLeft} />
      
      <Card>
        <CardHeader>
          <CardTitle>Your Solution</CardTitle>
          {timeLeft !== null && (
            <div className="text-sm font-medium text-amber-600">
              Time Left: {Math.floor(timeLeft / 60)}m {timeLeft % 60}s
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium">Language:</label>
              <select 
                value={language} 
                onChange={(e) => {
                  const newLang = e.target.value as keyof typeof DEFAULT_CODE_TEMPLATES;
                  handleLanguageChange(newLang);
                }}
                className="border rounded px-3 py-1"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
                <option value="c">C</option>
              </select>
            </div>

            <MonacoCodeEditor
              value={code}
              onChange={setCode}
              language={language}
              height="400px"
            />

          <Button 
            type="submit" 
            disabled={loading || !code.trim() || timeLeft === 0} 
            className="w-full" 
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : timeLeft === 0 ? (
              <>
                <Send className="h-4 w-4 mr-2" />
                Time's Up!
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Solution
              </>
            )}
          </Button>
        </form>
        {/* Show warning for Continuous Writing mode */}
        {mode === 'contwrite' && !submitted && (
          <div className="mb-2 text-yellow-700 text-sm">⚠️ Keep typing! If your code length doesn't increase every 10 seconds after 1 minute, you'll be disqualified.</div>
        )}
      </CardContent>
    </Card>
    </div>
  )
}
