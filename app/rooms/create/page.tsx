"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MainLayout } from "@/components/main-layout"

export default function CreateRoomPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    maxPlayers: "4",
    privacy: "public",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to create room")
      }

      const room = await response.json()
      alert("Room created successfully! Redirecting to your new room...")

      router.push(`/rooms/${room.id}`)
    } catch (error) {
      alert("Failed to create room. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Room</h1>
            <p className="text-gray-600">Set up your coding competition room. The question will be selected randomly based on difficulty when you start the game.</p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Room Settings</CardTitle>
                <CardDescription>Configure your coding competition room</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Room Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Friday Night Coding Challenge"
                      required
                    />
                    <p className="text-xs text-gray-500">Give your room a descriptive name</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="privacy">Room Privacy</Label>
                    <select
                      id="privacy"
                      value={formData.privacy}
                      onChange={(e) => setFormData({ ...formData, privacy: e.target.value })}
                      className="w-full border rounded-md px-3 py-2"
                    >
                      <option value="public">🌍 Public - Anyone can join</option>
                      <option value="private">🔒 Private - Need room code to join</option>
                    </select>
                    <p className="text-xs text-gray-500">
                      Public rooms appear in the browse list. Private rooms require a join code.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxPlayers">Maximum Players</Label>
                    <select
                      id="maxPlayers"
                      value={formData.maxPlayers}
                      onChange={(e) => setFormData({ ...formData, maxPlayers: e.target.value })}
                      className="w-full border rounded-md px-3 py-2"
                    >
                      <option value="2">2 Players</option>
                      <option value="3">3 Players</option>
                      <option value="4">4 Players</option>
                      <option value="5">5 Players</option>
                      <option value="6">6 Players</option>
                    </select>
                    <p className="text-xs text-gray-500">Choose how many players can join</p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-md">
                    <p className="text-sm text-blue-800 mb-2">
                      <strong>Note:</strong> After creating the room, you'll receive a unique join code that others can use to join your room.
                    </p>
                    <p className="text-sm text-blue-800">
                      When you start the game, you can select the difficulty and duration. The question will be chosen randomly from questions matching that difficulty.
                    </p>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Creating..." : "Create Room"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}