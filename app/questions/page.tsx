"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MainLayout } from "@/components/main-layout"
import { Plus, Search, Code, Play, X } from "lucide-react"
import { QUESTION_TOPICS } from "@/lib/constants"

interface Question {
  id: string
  title: string
  description: string
  difficulty: string
  topics: string[]
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState("")
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch("/api/questions")
        if (res.ok) {
          const data = await res.json()
          setQuestions(data)
        }
      } catch (e) {
      } finally {
        setLoading(false)
      }
    }
    fetchQuestions()
  }, [])

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch =
        !searchTerm ||
        q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesDifficulty = !difficultyFilter || q.difficulty === difficultyFilter
      const matchesTopics = selectedTopics.length === 0 || selectedTopics.every((t) => q.topics.includes(t))
      return matchesSearch && matchesDifficulty && matchesTopics
    })
  }, [questions, searchTerm, difficultyFilter, selectedTopics])

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) => (prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]))
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }


  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Problems</h1>
              <p className="text-gray-600">Browse, practice, and add coding problems</p>
            </div>
            <Link href="/questions/upload">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Problem
              </Button>
            </Link>
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search problems..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="border rounded-md px-3 py-2"
                >
                  <option value="">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setDifficultyFilter("")
                    setSelectedTopics([])
                  }}
                >
                  Clear Filters
                </Button>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Filter by Topics:</Label>
                <div className="flex flex-wrap gap-2">
                  {QUESTION_TOPICS.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => toggleTopic(topic)}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                        selectedTopics.includes(topic)
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-white text-gray-700 border-gray-300 hover:border-blue-500"
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
                {selectedTopics.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <span className="text-sm text-gray-600">Selected:</span>
                    {selectedTopics.map((topic) => (
                      <Badge key={topic} className="bg-blue-500 text-white">
                        {topic}
                        <button onClick={() => setSelectedTopics((prev) => prev.filter((t) => t !== topic))} className="ml-1 hover:bg-blue-600 rounded-full">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading questions...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No problems found</h3>
                <p className="text-gray-500 mb-4">
                  {questions.length === 0 ? "No problems have been created yet." : "No problems match your current filters."}
                </p>
                <Link href="/questions/upload">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Problem
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuestions.map((q) => (
                <Card key={q.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2">{q.title}</CardTitle>
                      <div className="flex flex-col gap-2 ml-2">
                        <Badge className={getDifficultyColor(q.difficulty)}>{q.difficulty}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-3 mb-4">{q.description}</CardDescription>
                    {q.topics?.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1">
                        {q.topics.map((t) => (
                          <Badge key={t} variant="outline" className="text-xs">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex space-x-2">
                      <Link href={`/practice/${q.id}`} className="flex-1">
                        <Button className="w-full">
                          <Play className="h-4 w-4 mr-2" />
                          Solve
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}