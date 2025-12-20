'use server'

import { prisma } from '@/lib/prisma'
import { auth, currentUser } from '@clerk/nextjs/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

// ================================
// Public Feedback Actions (No Auth Required)
// ================================

export async function getFeedback(options?: {
  category?: string
  status?: string
  sort?: 'votes' | 'newest' | 'oldest'
  search?: string
  limit?: number
  offset?: number
}) {
  const where: Record<string, unknown> = {}
  
  if (options?.category && options.category !== 'ALL') {
    where.category = options.category
  }
  if (options?.status && options.status !== 'ALL') {
    where.status = options.status
  }
  if (options?.search) {
    where.OR = [
      { title: { contains: options.search, mode: 'insensitive' } },
      { description: { contains: options.search, mode: 'insensitive' } },
    ]
  }

  const orderBy: Record<string, string>[] = []
  // Pinned items always first
  orderBy.push({ isPinned: 'desc' })
  
  if (options?.sort === 'votes') {
    orderBy.push({ voteCount: 'desc' })
  } else if (options?.sort === 'oldest') {
    orderBy.push({ createdAt: 'asc' })
  } else {
    orderBy.push({ createdAt: 'desc' })
  }

  const [items, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy,
      take: options?.limit || 20,
      skip: options?.offset || 0,
      include: {
        _count: { select: { replies: true } },
      },
    }),
    prisma.feedback.count({ where }),
  ])

  return { items, total }
}

export async function getFeedbackById(id: string) {
  return prisma.feedback.findUnique({
    where: { id },
    include: {
      replies: {
        orderBy: { createdAt: 'asc' },
      },
      _count: { select: { votes: true, replies: true } },
    },
  })
}

// Check if user already voted
export async function hasVoted(feedbackId: string, email: string) {
  const vote = await prisma.feedbackVote.findFirst({
    where: { feedbackId, voterEmail: email },
  })
  return !!vote
}

// Get user's votes for multiple feedback items
export async function getUserVotes(feedbackIds: string[], email: string) {
  const votes = await prisma.feedbackVote.findMany({
    where: { feedbackId: { in: feedbackIds }, voterEmail: email },
    select: { feedbackId: true },
  })
  return votes.map(v => v.feedbackId)
}

// ================================
// Submit Feedback (Email Required)
// ================================

const submitFeedbackSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  category: z.enum(['FEATURE', 'BUG', 'IMPROVEMENT', 'QUESTION']),
  authorName: z.string().min(2).max(100),
  authorEmail: z.string().email(),
})

type SubmitFeedbackInput = z.input<typeof submitFeedbackSchema>

export async function submitFeedback(input: SubmitFeedbackInput) {
  const validated = submitFeedbackSchema.parse(input)
  
  // Check if user is logged in
  const { userId } = await auth()
  
  const feedback = await prisma.feedback.create({
    data: {
      title: validated.title,
      description: validated.description,
      category: validated.category,
      authorName: validated.authorName,
      authorEmail: validated.authorEmail,
      authorUserId: userId || null,
      voteCount: 1, // Auto-upvote own submission
    },
  })

  // Auto-vote for own submission
  await prisma.feedbackVote.create({
    data: {
      feedbackId: feedback.id,
      voterEmail: validated.authorEmail,
      voterUserId: userId || null,
    },
  })

  revalidatePath('/feedback')
  return feedback
}

// ================================
// Voting (Email Required)
// ================================

export async function voteFeedback(feedbackId: string, voterEmail: string, voterName?: string) {
  // Check if already voted
  const existingVote = await prisma.feedbackVote.findFirst({
    where: { feedbackId, voterEmail },
  })

  if (existingVote) {
    // Remove vote (toggle)
    await prisma.feedbackVote.delete({ where: { id: existingVote.id } })
    await prisma.feedback.update({
      where: { id: feedbackId },
      data: { voteCount: { decrement: 1 } },
    })
    revalidatePath('/feedback')
    return { voted: false }
  }

  // Check if logged in
  const { userId } = await auth()

  // Add vote
  await prisma.feedbackVote.create({
    data: {
      feedbackId,
      voterEmail,
      voterUserId: userId || null,
    },
  })
  await prisma.feedback.update({
    where: { id: feedbackId },
    data: { voteCount: { increment: 1 } },
  })

  revalidatePath('/feedback')
  return { voted: true }
}

// ================================
// Replies (Auth Required)
// ================================

const replySchema = z.object({
  feedbackId: z.string().min(1),
  content: z.string().min(5).max(2000),
})

type ReplyInput = z.input<typeof replySchema>

export async function addReply(input: ReplyInput) {
  const { userId } = await auth()
  if (!userId) throw new Error('Must be logged in to reply')

  const user = await currentUser()
  if (!user) throw new Error('User not found')

  const validated = replySchema.parse(input)

  const reply = await prisma.feedbackReply.create({
    data: {
      feedbackId: validated.feedbackId,
      content: validated.content,
      authorName: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.emailAddresses[0].emailAddress,
      authorEmail: user.emailAddresses[0].emailAddress,
      authorUserId: userId,
      isOfficial: false, // TODO: Check if user is admin
    },
  })

  revalidatePath('/feedback')
  revalidatePath(`/feedback/${validated.feedbackId}`)
  return reply
}

// ================================
// Admin Actions (Auth + Admin Check Required)
// ================================

export async function updateFeedbackStatus(feedbackId: string, status: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Must be logged in')

  // Get current feedback to check old status and author info
  const existingFeedback = await prisma.feedback.findUnique({
    where: { id: feedbackId },
  })
  if (!existingFeedback) throw new Error('Feedback not found')
  
  const oldStatus = existingFeedback.status
  if (oldStatus === status) {
    return existingFeedback // No change needed
  }

  const feedback = await prisma.feedback.update({
    where: { id: feedbackId },
    data: { status },
  })

  // Send email notification to author
  try {
    const { sendFeedbackStatusChange } = await import('@/lib/email')
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    await sendFeedbackStatusChange({
      feedbackTitle: feedback.title,
      feedbackId: feedback.id,
      authorName: feedback.authorName,
      authorEmail: feedback.authorEmail,
      oldStatus,
      newStatus: status,
      feedbackUrl: `${baseUrl}/feedback/${feedback.id}`,
    })
  } catch (emailError) {
    console.error('Failed to send status change email:', emailError)
    // Don't fail the status update if email fails
  }

  revalidatePath('/feedback')
  revalidatePath(`/feedback/${feedbackId}`)
  return feedback
}

export async function toggleFeedbackPin(feedbackId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Must be logged in')

  const feedback = await prisma.feedback.findUnique({ where: { id: feedbackId } })
  if (!feedback) throw new Error('Feedback not found')

  const updated = await prisma.feedback.update({
    where: { id: feedbackId },
    data: { isPinned: !feedback.isPinned },
  })

  revalidatePath('/feedback')
  return updated
}

export async function deleteFeedback(feedbackId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Must be logged in')

  await prisma.feedback.delete({ where: { id: feedbackId } })
  revalidatePath('/feedback')
}

// ================================
// Stats
// ================================

export async function getFeedbackStats() {
  const [total, byStatus, byCategory] = await Promise.all([
    prisma.feedback.count(),
    prisma.feedback.groupBy({
      by: ['status'],
      _count: true,
    }),
    prisma.feedback.groupBy({
      by: ['category'],
      _count: true,
    }),
  ])

  return {
    total,
    byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count])),
    byCategory: Object.fromEntries(byCategory.map(c => [c.category, c._count])),
  }
}
