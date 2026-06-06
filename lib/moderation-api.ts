import { NextResponse } from 'next/server'
import { getModerationSettings } from '@/sanity/lib/moderation-queries'
import { moderateContentAsync, type ModerationResultWithMeta } from '@/lib/moderation-service'

function formatResult(result: ModerationResultWithMeta, settingsApplied: boolean) {
  return {
    success: true,
    result: {
      isFlagged: result.isFlagged,
      severity: result.severity,
      action: result.action,
      reason: result.reason,
      patterns: result.patterns,
      confidence: result.confidence,
      primaryCategory: result.primaryCategory,
    },
    source: result.source,
    model: result.model,
    latencyMs: result.latencyMs,
    settingsApplied,
  }
}

export async function runModerationCheck(content: string) {
  const settings = await getModerationSettings()
  const result = await moderateContentAsync(content.trim(), settings)
  return formatResult(result, settings !== null)
}

export async function moderationCheckHandler(content: unknown) {
  if (!content || typeof content !== 'string') {
    return NextResponse.json(
      { error: 'content string is required' },
      { status: 400 }
    )
  }

  try {
    const response = await runModerationCheck(content)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error running moderation check:', error)
    return NextResponse.json(
      { error: 'Failed to run moderation check' },
      { status: 500 }
    )
  }
}
