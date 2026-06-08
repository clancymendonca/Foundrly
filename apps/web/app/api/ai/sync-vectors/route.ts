import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { AIVectorSync } from '@/lib/ai-vector-sync';
import { canUserPerformAction } from '@/lib/ban-checks';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
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

    // For now, allow any authenticated user to sync
    // In production, you might want to restrict this to admins only
    const { action, batchSize } = await request.json();

    if (action === 'sync-all') {
      await AIVectorSync.syncAllStartups();
      return NextResponse.json({
        success: true,
        message: 'All startups synced successfully'
      });
    } else if (action === 'sync-batch') {
      await AIVectorSync.syncStartupsBatch(batchSize || 50);
      return NextResponse.json({
        success: true,
        message: 'Batch sync completed successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Invalid action. Use "sync-all" or "sync-batch"'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in vector sync API:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to sync vectors' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 });
    }

    // Get sync status
    const status = await AIVectorSync.getSyncStatus();

    return NextResponse.json({
      success: true,
      status
    });

  } catch (error) {
    console.error('Error getting sync status:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to get sync status' 
    }, { status: 500 });
  }
}

