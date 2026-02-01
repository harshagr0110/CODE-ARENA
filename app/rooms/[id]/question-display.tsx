"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface QuestionDisplayProps {
  question: any
  timeLeft?: number | null
}

export function QuestionDisplay({ question, timeLeft }: QuestionDisplayProps) {
  if (!question) {
    return (
      <Card className="mb-6">
        <CardContent className="py-6 text-center">
          <p className="text-amber-600">Loading question data...</p>
        </CardContent>
      </Card>
    )
  }

  // Get test cases in a safe way
  let testCases = [];
  
  if (question.testCases) {
    if (typeof question.testCases === 'string') {
      try {
        testCases = JSON.parse(question.testCases);
      } catch {
        testCases = [];
      }
    } else if (Array.isArray(question.testCases)) {
      testCases = question.testCases;
    }
  }

  return (
    <Card className="mb-6" id="question-container">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">{question.title}</CardTitle>
          <Badge variant={question.difficulty === 'easy' ? 'outline' : 
                          question.difficulty === 'medium' ? 'secondary' : 
                          'destructive'}>
            {question.difficulty}
          </Badge>
        </div>
        
        {/* Topics Display */}
        {question.topics && question.topics.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {question.topics.map((topic: string) => (
              <Badge key={topic} variant="outline" className="text-xs">
                {topic}
              </Badge>
            ))}
          </div>
        )}
        
        {timeLeft !== null && timeLeft !== undefined && (
          <div className="text-sm font-medium mt-2">
            Time Left: {Math.floor(timeLeft / 60)}m {timeLeft % 60}s
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="prose prose-sm max-w-none">
          <div dangerouslySetInnerHTML={{ __html: question.description }} />
        </div>
        
        {testCases.length > 0 && (
          <div className="space-y-3 mt-4">
            <h3 className="text-base font-medium">Example Test Cases:</h3>
            <div className="space-y-3">
              {testCases.slice(0, 2).map((tc: any, i: number) => (
                <div key={i} className="bg-gray-50 p-3 rounded-md text-sm">
                  <div className="font-medium text-xs text-gray-500 mb-1">Example {i + 1}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="font-medium text-xs mb-1">Input:</div>
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">{tc.input}</pre>
                    </div>
                    <div>
                      <div className="font-medium text-xs mb-1">Expected Output:</div>
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">{tc.expectedOutput}</pre>
                    </div>
                  </div>
                  {tc.explanation && (
                    <div className="mt-2">
                      <div className="font-medium text-xs mb-1">Explanation:</div>
                      <div className="text-xs">{tc.explanation}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {testCases.length > 2 && (
              <p className="text-xs text-gray-600">
                {testCases.length - 2} additional test case{testCases.length - 2 === 1 ? '' : 's'} hidden; all cases run when you submit.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
