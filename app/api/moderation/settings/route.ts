import { NextResponse } from 'next/server'
import { getModerationSettings } from '@/sanity/lib/moderation-queries'
import { saveModerationSettings } from '@/sanity/lib/moderation-mutations'
import { auth } from '@/auth'

export async function GET() {
  try {
    const settings = await getModerationSettings()
    
    return NextResponse.json({
      success: true,
      settings
    })
  } catch (error) {
    console.error('Error fetching moderation settings:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch moderation settings' 
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin access is handled through Sanity Studio
    // This endpoint is for programmatic access only

    const body = await request.json()
    const { settings } = body

    if (!settings) {
      return NextResponse.json({ 
        error: 'Settings object is required' 
      }, { status: 400 })
    }

    // Validate settings
    const validationErrors = validateModerationSettings(settings)
    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Invalid settings',
        details: validationErrors
      }, { status: 400 })
    }

    const savedSettings = await saveModerationSettings(settings)
    
    return NextResponse.json({
      success: true,
      settings: savedSettings,
      message: 'Moderation settings updated successfully'
    })
  } catch (error) {
    console.error('Error updating moderation settings:', error)
    return NextResponse.json({ 
      error: 'Failed to update moderation settings' 
    }, { status: 500 })
  }
}

function validateModerationSettings(settings: any): string[] {
  const errors: string[] = []

  // Check required fields
  if (typeof settings.autoModerationEnabled !== 'boolean') {
    errors.push('autoModerationEnabled must be a boolean')
  }

  if (typeof settings.profanityCheckEnabled !== 'boolean') {
    errors.push('profanityCheckEnabled must be a boolean')
  }

  if (typeof settings.hateSpeechCheckEnabled !== 'boolean') {
    errors.push('hateSpeechCheckEnabled must be a boolean')
  }

  if (typeof settings.threatDetectionEnabled !== 'boolean') {
    errors.push('threatDetectionEnabled must be a boolean')
  }

  if (typeof settings.spamDetectionEnabled !== 'boolean') {
    errors.push('spamDetectionEnabled must be a boolean')
  }

  if (typeof settings.personalInfoCheckEnabled !== 'boolean') {
    errors.push('personalInfoCheckEnabled must be a boolean')
  }

  // Check numeric fields
  if (typeof settings.maxStrikes !== 'number' || settings.maxStrikes < 1 || settings.maxStrikes > 10) {
    errors.push('maxStrikes must be a number between 1 and 10')
  }

  if (typeof settings.firstStrikeBanHours !== 'number' || settings.firstStrikeBanHours < 1) {
    errors.push('firstStrikeBanHours must be a positive number')
  }

  if (typeof settings.secondStrikeBanDays !== 'number' || settings.secondStrikeBanDays < 1) {
    errors.push('secondStrikeBanDays must be a positive number')
  }

  // Check string fields
  if (typeof settings.defaultBanReason !== 'string' || settings.defaultBanReason.trim().length === 0) {
    errors.push('defaultBanReason must be a non-empty string')
  }

  if (typeof settings.warningMessage !== 'string') {
    errors.push('warningMessage must be a string')
  }

  return errors
} 