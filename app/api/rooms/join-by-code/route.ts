import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { joinCode } = await request.json()
  if (!joinCode) return NextResponse.json({ error: "Join code is required" }, { status: 400 })
  const room = await prisma.room.findUnique({ where: { joinCode: joinCode.toUpperCase() } })
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 })
  let participants = []
  try { participants = JSON.parse(typeof room.participants === "string" ? room.participants : "[]") } catch { participants = [] }
  if (participants.length >= (room.maxPlayers || 10)) return NextResponse.json({ error: "Room is full" }, { status: 400 })
  if (room.status !== "waiting") return NextResponse.json({ error: "Room is not accepting players" }, { status: 400 })
  if (!participants.some((p: any) => p.id === user.id)) {
    participants.push({ id: user.id, username: user.username })
    await prisma.room.update({ where: { id: room.id }, data: { participants: JSON.stringify(participants) } })
  }
  return NextResponse.json({ roomId: room.id })
}
