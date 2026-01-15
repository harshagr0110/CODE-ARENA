"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function JoinByCode() {
  const [joinCode, setJoinCode] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    setLoading(true)
    const response = await fetch("/api/rooms/join-by-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ joinCode: joinCode.trim().toUpperCase() })
    })
    const data = await response.json()
    if (!response.ok) return setLoading(false)
    router.push(`/rooms/${data.roomId}`)
    setLoading(false)
  }

  return (
    <form onSubmit={handleJoinByCode} className="flex gap-3">
      <Input
        id="joinCode"
        value={joinCode}
        onChange={(e) => setJoinCode(e.target.value)}
        placeholder="Enter room code (e.g., ABC123)"
        autoComplete="off"
        maxLength={6}
        className="flex-1 uppercase"
        required
      />
      <Button type="submit" disabled={loading || !joinCode.trim()}>
        {loading ? "Joining..." : "Join"}
      </Button>
    </form>
  )
}
