import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { aiService } from '@/lib/ai-services';
import { canUserPerformAction } from '@/lib/ban-checks';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized - Please log in to get recommendations' 
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get personalized recommendations
    const recommendations = await aiService.getPersonalizedRecommendations(session.user.id, limit);

    return NextResponse.json({
      success: true,
      recommendations
    });

  } catch (error) {
    console.error('Error in recommendations API:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to get recommendations' 
    }, { status: 500 });
  }
}

