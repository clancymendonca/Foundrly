import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { aiService } from '@/lib/ai-services';
import { canUserPerformAction } from '@/lib/ban-checks';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized - Please log in to generate content' 
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

    const { idea, category, title, description } = await request.json();

    // Check if we have existing title and description for content generation
    if (title && description) {
      // Generate additional content from existing title and description
      const content = await aiService.generateStartupContent(
        idea || '', // Use idea as fallback if provided
        category || 'General',
        title.trim(),
        description.trim()
      );
      
      return NextResponse.json({
        success: true,
        content
      });
    }

    // Original flow: generate complete content from idea
    if (!idea || idea.trim().length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Startup idea is required' 
      }, { status: 400 });
    }

    // Generate content using AI
    const content = await aiService.generateStartupContent(idea.trim(), category || 'General');

    return NextResponse.json({
      success: true,
      content
    });

  } catch (error) {
    console.error('Error in content generation API:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to generate content' 
    }, { status: 500 });
  }
}

