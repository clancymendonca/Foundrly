import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { client } from '@/sanity/lib/client'
import { writeClient } from '@/sanity/lib/write-client'
import { calculateBanEndDate } from '@/sanity/lib/moderation'
import { 
  calculateStrikeBan, 
  createBanHistoryEntry, 
  getCurrentStrikeCount 
} from '@/sanity/lib/strike-system'
import { logModerationActivity } from '@/sanity/lib/moderation-mutations'

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      reportedUserId, 
      banDuration, 
      reason, 
      reportId 
    } = body

    // Validate required fields
    if (!reportedUserId || !banDuration || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: reportedUserId, banDuration, reason' },
        { status: 400 }
      )
    }

    // Validate ban duration
    if (!['1h', '24h', '7d', '365d', 'perm'].includes(banDuration)) {
      return NextResponse.json(
        { error: 'Invalid ban duration' },
        { status: 400 }
      )
    }

    // Get the reported user with current ban status
    const reportedUser = await client.fetch(
      `*[_type == "author" && _id == $userId][0]{
        _id, 
        name, 
        username, 
        bannedUntil, 
        isBanned, 
        banHistory,
        strikeCount
      }`,
      { userId: reportedUserId }
    )

    if (!reportedUser) {
      return NextResponse.json(
        { error: 'Reported user not found' },
        { status: 404 }
      )
    }

    // Calculate current strike count
    const currentStrikes = getCurrentStrikeCount(reportedUser.banHistory || [])
    
    // Determine the appropriate ban based on strike system
    const strikeResult = calculateStrikeBan(currentStrikes, banDuration)
    
    // Calculate ban end date
    const banEndDate = strikeResult.isPermanent ? null : calculateBanEndDate(strikeResult.banDuration as any)
    
    // Create ban history entry
    const banHistoryEntry = createBanHistoryEntry(
      strikeResult.banDuration,
      reason,
      reportId,
      strikeResult.strikeNumber
    )

    // Update the user with the new ban
    const updatedUser = await writeClient
      .patch(reportedUserId)
      .set({
        isBanned: true,
        bannedUntil: banEndDate ? banEndDate.toISOString() : null,
        strikeCount: strikeResult.strikeNumber,
        banHistory: [
          ...(reportedUser.banHistory || []),
          banHistoryEntry
        ]
      })
      .commit()

    // Update the report status
    if (reportId) {
      await writeClient
        .patch(reportId)
        .set({
          status: 'action-taken',
          banDuration: strikeResult.banDuration,
          adminNotes: `${reason}\n\nApplied: ${strikeResult.reason}`
        })
        .commit()
    }

    // Log moderation activity
    await logModerationActivity({
      type: 'user_banned',
      userId: reportedUserId,
      userName: reportedUser.name || reportedUser.username || 'Unknown User',
      reason: reason,
      severity: strikeResult.isPermanent ? 'critical' : 'high',
      itemId: reportId,
      itemType: 'report',
      source: 'studio',
    })

    return NextResponse.json({
      success: true,
      message: `Ban applied successfully. ${strikeResult.reason}`,
      banDetails: {
        duration: strikeResult.banDuration,
        isPermanent: strikeResult.isPermanent,
        strikeNumber: strikeResult.strikeNumber,
        banEndDate: banEndDate?.toISOString() || null,
        reason: strikeResult.reason
      },
      user: updatedUser
    })

  } catch (error) {
    console.error('Error applying ban:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 