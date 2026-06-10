import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { aiService } from '@/lib/ai-services';
import { canUserPerformAction } from '@/lib/ban-checks';
import { formatAiErrorMessage } from '@foundrly/shared';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized - Please log in to analyze pitches' 
      }, { status: 401 });
    }

    // Check if user is banned
    const banCheck = await canUserPerformAction(session.user.id);
    if (!banCheck.canPerform) {
      return NextResponse.json({ 
        success: false, 
        message: banCheck.message 
      }, { status: 403 });
    }

    const { pitch, title, category } = await request.json();

    if (!pitch || !title) {
      return NextResponse.json({ 
        success: false, 
        message: 'Pitch and title are required' 
      }, { status: 400 });
    }

    // Analyze the pitch using AI
    const analysis = await aiService.analyzePitch(title, pitch, category || 'General');

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Error in pitch analysis API:', error);
    return NextResponse.json({
      success: false,
      message: formatAiErrorMessage(error, 'Failed to analyze pitch'),
    }, { status: 500 });
  }
}

