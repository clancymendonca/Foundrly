import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session';
import { client } from '@/sanity/lib/client'
import { writeClient } from '@/sanity/lib/write-client'
import { logModerationActivity } from '@/sanity/lib/moderation-mutations'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reportedType, reportedRef, reason } = body

    // Validate required fields
    if (!reportedType || !reportedRef || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: reportedType, reportedRef, reason' },
        { status: 400 }
      )
    }

    // Validate reportedType
    if (!['startup', 'comment', 'user'].includes(reportedType)) {
      return NextResponse.json(
        { error: 'Invalid reportedType. Must be startup, comment, or user' },
        { status: 400 }
      )
    }

    // Get the user who is reporting
    const user = await client.fetch(
      `*[_type == "author" && email == $email][0]`,
      { email: session.user.email }
    )

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify the reported reference exists
    const reportedItem = await client.fetch(
      `*[_type == $reportedType && _id == $reportedRef][0]`,
      { reportedType, reportedRef }
    )

    if (!reportedItem) {
      return NextResponse.json(
        { error: 'Reported item not found' },
        { status: 404 }
      )
    }

    // Create the report
    const report = await writeClient.create({
      _type: 'report',
      reportedType,
      reportedRef: {
        _type: 'reference',
        _ref: reportedRef,
      },
      reason,
      reportedBy: {
        _type: 'reference',
        _ref: user._id,
      },
      timestamp: new Date().toISOString(),
      status: 'pending',
    })

    // Log moderation activity
    await logModerationActivity({
      type: 'report_created',
      userId: user._id,
      userName: user.name || user.username || 'Unknown User',
      reason: reason,
      severity: 'medium',
      itemId: report._id,
      itemType: 'report'
    })

    return NextResponse.json({ 
      success: true, 
      reportId: report._id,
      message: 'Report submitted successfully' 
    })

  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 