import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { AIVectorSync } from '@/lib/ai-vector-sync';

export async function POST(request: NextRequest) {
  console.log('🚀 [COMPREHENSIVE SYNC API] Starting comprehensive vector sync request');
  
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user) {
      console.log('❌ [COMPREHENSIVE SYNC API] Unauthorized access attempt');
      return NextResponse.json({ 
        success: false, 
        message: 'Authentication required' 
      }, { status: 401 });
    }

    console.log('✅ [COMPREHENSIVE SYNC API] User authenticated:', session.user.email);

    // Parse request body
    const body = await request.json();
    const { action, batchSize = 25 } = body;

    console.log('📊 [COMPREHENSIVE SYNC API] Request parameters:', { action, batchSize });

    if (action === 'sync-all') {
      console.log('🔄 [COMPREHENSIVE SYNC API] Starting comprehensive bulk sync...');
      
      // Perform comprehensive bulk sync
      await AIVectorSync.syncAllStartups();
      
      console.log('✅ [COMPREHENSIVE SYNC API] Comprehensive bulk sync completed successfully');
      
      return NextResponse.json({
        success: true,
        message: 'Comprehensive vector sync completed successfully! All startup vectors have been updated with enhanced data.',
        action: 'sync-all',
        timestamp: new Date().toISOString()
      });

    } else if (action === 'sync-batch') {
      console.log('📦 [COMPREHENSIVE SYNC API] Starting comprehensive batch sync...');
      
      // Perform comprehensive batch sync
      await AIVectorSync.syncStartupsBatch(batchSize);
      
      console.log('✅ [COMPREHENSIVE SYNC API] Comprehensive batch sync completed successfully');
      
      return NextResponse.json({
        success: true,
        message: `Comprehensive batch sync completed successfully! Processed startups in batches of ${batchSize}.`,
        action: 'sync-batch',
        batchSize,
        timestamp: new Date().toISOString()
      });

    } else {
      console.log('❌ [COMPREHENSIVE SYNC API] Invalid action:', action);
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid action. Use "sync-all" or "sync-batch".' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [COMPREHENSIVE SYNC API] Error in comprehensive sync:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: 'Comprehensive sync failed. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  console.log('📊 [COMPREHENSIVE SYNC API] Getting sync status');
  
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Authentication required' 
      }, { status: 401 });
    }

    // Get sync status
    const status = await AIVectorSync.getSyncStatus();
    
    console.log('📊 [COMPREHENSIVE SYNC API] Sync status retrieved:', status);
    
    return NextResponse.json({
      success: true,
      status,
      message: 'Sync status retrieved successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [COMPREHENSIVE SYNC API] Error getting sync status:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to get sync status',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
