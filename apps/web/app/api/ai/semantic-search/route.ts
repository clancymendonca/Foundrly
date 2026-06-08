import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { aiService } from '@/lib/ai-services';

export async function GET(request: NextRequest) {
  console.log('🔍 [SEMANTIC SEARCH API] Starting semantic search request');
  
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');

    console.log('🔍 [SEMANTIC SEARCH API] Request params:', { query, limit });

    if (!query || query.trim().length === 0) {
      console.log('❌ [SEMANTIC SEARCH API] No query provided');
      return NextResponse.json({ 
        success: false, 
        message: 'Search query is required' 
      }, { status: 400 });
    }

    console.log('🔍 [SEMANTIC SEARCH API] Calling aiService.semanticSearch with:', { query: query.trim(), limit });
    
    // Perform semantic search
    const results = await aiService.semanticSearch(query.trim(), limit);

    console.log('✅ [SEMANTIC SEARCH API] Search completed successfully:', {
      resultsCount: results?.startups?.length || 0,
      confidence: results?.confidence || 0,
      fallbackUsed: results?.fallbackUsed || false,
      reasons: results?.reasons || []
    });

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    const errSearch = new URL(request.url).searchParams;
    console.error('❌ [SEMANTIC SEARCH API] Error in semantic search API:');
    console.error('  Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('  Query:', errSearch.get('q'));
    console.error('  Limit:', parseInt(errSearch.get('limit') || '10'));
    if (error instanceof Error && error.stack) {
      console.error('  Stack trace:', error.stack);
    }
    
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to perform semantic search' 
    }, { status: 500 });
  }
}

