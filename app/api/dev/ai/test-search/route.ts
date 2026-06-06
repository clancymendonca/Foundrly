import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-services';
import { devOnlyGuard } from '@/lib/dev-only';

export async function GET(request: NextRequest) {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'test';
    const limit = parseInt(searchParams.get('limit') || '5');

    // Test the improved search
    const results = await aiService.semanticSearch(query, limit);

    return NextResponse.json({
      success: true,
      query,
      results,
      improvements: {
        enhancedQuery: 'Query enhancement applied',
        betterFiltering: 'Intelligent filtering and ranking applied',
        improvedEmbeddings: 'Enhanced text preprocessing for better semantic understanding'
      }
    });

  } catch (error) {
    console.error('Error in test search API:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to perform test search',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
