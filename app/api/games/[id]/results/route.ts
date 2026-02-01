import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface Props {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: Props
) {
  const { id: gameId } = await params;
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get game details with submissions and question
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        submissions: {
          include: {
            user: true
          }
        },
        question: true,
        room: true
      }
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Format submissions
    const submissions = game.submissions.map((submission) => ({
      id: submission.id,
      userId: submission.userId,
      username: submission.user.username,
      language: submission.language,
      isCorrect: submission.isCorrect,
      executionTime: submission.executionTime,
      feedback: submission.feedback,
      submittedAt: submission.submittedAt,
      code: submission.code
    }));

    // Get winner info
    const winner = game.winnerId 
      ? await prisma.user.findUnique({ where: { id: game.winnerId } })
      : null;
    
    return NextResponse.json({
      room: {
        id: game.room.id,
        joinCode: game.room.joinCode,
        isActive: game.room.isActive,
        hostId: game.room.hostId,
      },
      game: {
        id: game.id,
        questionId: game.questionId,
        difficulty: game.difficulty,
        winnerId: game.winnerId,
        winnerName: winner?.username || null,
        startedAt: game.startedAt,
        endedAt: game.endedAt,
      },
      question: {
        id: game.question.id,
        title: game.question.title,
        description: game.question.description,
        difficulty: game.question.difficulty,
      },
      submissions: submissions,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch game results" },
      { status: 500 }
    );
  }
}
