import { NextRequest, NextResponse } from 'next/server';
import { AIVectorSync } from '@/lib/ai-vector-sync';
import { devOnlyGuard } from '@/lib/dev-only';

export async function POST(request: NextRequest) {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  console.log('🚀 [TEST SYNC API] Starting test vector sync (no auth required)');
  
  try {
    // Parse request body
    const body = await request.json();
    const { action, batchSize = 25 } = body;

    console.log('📊 [TEST SYNC API] Request parameters:', { action, batchSize });

    if (action === 'sync-all') {
      console.log('🔄 [TEST SYNC API] Starting comprehensive bulk sync...');
      
      // Perform comprehensive bulk sync
      await AIVectorSync.syncAllStartups();
      
      console.log('✅ [TEST SYNC API] Comprehensive bulk sync completed successfully');
      
      return NextResponse.json({
        success: true,
        message: 'Comprehensive vector sync completed successfully! All startup vectors have been updated with enhanced data.',
        action: 'sync-all',
        timestamp: new Date().toISOString()
      });

    } else if (action === 'sync-batch') {
      console.log('📦 [TEST SYNC API] Starting comprehensive batch sync...');
      
      // Perform comprehensive batch sync
      await AIVectorSync.syncStartupsBatch(batchSize);
      
      console.log('✅ [TEST SYNC API] Comprehensive batch sync completed successfully');
      
      return NextResponse.json({
        success: true,
        message: `Comprehensive batch sync completed successfully! Processed startups in batches of ${batchSize}.`,
        action: 'sync-batch',
        batchSize,
        timestamp: new Date().toISOString()
      });

    } else {
      console.log('❌ [TEST SYNC API] Invalid action:', action);
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid action. Use "sync-all" or "sync-batch".' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [TEST SYNC API] Error in test sync:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: 'Test sync failed. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  console.log('📊 [TEST SYNC API] Getting sync status');
  
  try {
    // Get sync status
    const status = await AIVectorSync.getSyncStatus();
    
    console.log('📊 [TEST SYNC API] Sync status retrieved:', status);
    
    return NextResponse.json({
      success: true,
      status,
      message: 'Sync status retrieved successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [TEST SYNC API] Error getting sync status:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to get sync status',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
