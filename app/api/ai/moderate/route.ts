import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canUserPerformAction } from '@/lib/ban-checks';
import { getModerationSettings } from '@/sanity/lib/moderation-queries';
import { moderateContentAsync } from '@/lib/moderation-service';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - Please log in to moderate content',
      }, { status: 401 });
    }

    const banCheck = await canUserPerformAction(session.user.id);
    if (!banCheck.canPerform) {
      return NextResponse.json({
        success: false,
        message: banCheck.message,
      }, { status: 403 });
    }

    const { content, contentType } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Content is required',
      }, { status: 400 });
    }

    const settings = await getModerationSettings();
    const result = await moderateContentAsync(content.trim(), settings);

    const moderation = {
      isFlagged: result.isFlagged,
      severity: result.severity,
      action: result.action,
      reason: result.reason,
      patterns: result.patterns,
      confidence: result.confidence,
      primaryCategory: result.primaryCategory,
      recommendation: result.isFlagged ? result.action : 'approve',
      issues: result.patterns,
      explanation: result.reason,
      contentType: contentType || 'startup',
      source: result.source,
      model: result.model,
      latencyMs: result.latencyMs,
    };

    return NextResponse.json({
      success: true,
      moderation,
    });
  } catch (error) {
    console.error('Error in content moderation API:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to moderate content',
    }, { status: 500 });
  }
}
