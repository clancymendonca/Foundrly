import { NextRequest, NextResponse } from 'next/server';
import { MarketDataService } from '@/lib/market-data-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const action = searchParams.get('action');

  try {
    if (action === 'clear-cache') {
      MarketDataService.clearCache();
      return NextResponse.json({
        success: true,
        message: 'Cache cleared successfully'
      });
    }

    if (action === 'cache-stats') {
      const stats = MarketDataService.getCacheStats();
      return NextResponse.json({
        success: true,
        data: stats
      });
    }

    if (category) {
      const marketData = await MarketDataService.getMarketData(category);
      return NextResponse.json({
        success: true,
        data: marketData
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Missing category parameter'
    }, { status: 400 });

  } catch (error) {
    console.error('Market data API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch market data'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categories } = body;

    if (!categories || !Array.isArray(categories)) {
      return NextResponse.json({
        success: false,
        message: 'Categories array is required'
      }, { status: 400 });
    }

    const marketTrends = await MarketDataService.getMarketTrends(categories);
    
    return NextResponse.json({
      success: true,
      data: marketTrends
    });

  } catch (error) {
    console.error('Market trends API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch market trends'
    }, { status: 500 });
  }
}



