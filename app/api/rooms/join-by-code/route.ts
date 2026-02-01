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
  let participants: any[] = []
  try { participants = Array.isArray(room.participants) ? room.participants as any[] : JSON.parse(room.participants as unknown as string) } catch { participants = [] }
  if (participants.length >= (room.maxPlayers || 10)) return NextResponse.json({ error: "Room is full" }, { status: 400 })
  if (!room.isActive) return NextResponse.json({ error: "Room is not active" }, { status: 400 })
  if (!participants.some((p: any) => p.id === user.id)) {
    participants.push({ id: user.id, username: user.username })
    await prisma.room.update({ where: { id: room.id }, data: { participants } })
  }
  return NextResponse.json({ roomId: room.id })
}
