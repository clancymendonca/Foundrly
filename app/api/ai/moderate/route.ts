import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canUserPerformAction } from '@/lib/ban-checks';
import { getModerationSettings } from '@/sanity/lib/moderation-queries';
import { moderateContentAsync } from '@/lib/moderation-service';

/**
 * Handles content moderation requests and returns a normalized moderation result.
 *
 * Expects the request body to be JSON with `content` (required) and an optional `contentType`.
 *
 * @param request - NextRequest whose JSON body must include `content` and may include `contentType`
 * @returns A JSON response object:
 * - `success`: `true` on successful moderation, `false` otherwise
 * - On success, `moderation`: an object with:
 *   - `isFlagged`: whether the content was flagged
 *   - `severity`: severity level of the issue
 *   - `action`: recommended action (e.g., "remove", "review")
 *   - `reason`: human-readable reason for the decision
 *   - `patterns`: detected violation patterns
 *   - `confidence`: confidence score
 *   - `primaryCategory`: primary moderation category
 *   - `recommendation`: `action` when flagged, otherwise `"approve"`
 *   - `issues`: same as `patterns`
 *   - `explanation`: same as `reason`
 *   - `contentType`: the provided content type or `"startup"` by default
 *   - `source`, `model`, `latencyMs`: metadata about the moderation result
 */
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
