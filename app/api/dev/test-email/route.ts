import { NextRequest, NextResponse } from 'next/server';
import { testEmailConfiguration } from '@/lib/notifications/emailNotifications';
import { devOnlyGuard } from '@/lib/dev-only';

export async function GET(req: NextRequest) {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  try {
    const result = await testEmailConfiguration();
    
    return NextResponse.json({
      success: result.success,
      message: result.message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error testing email configuration:', error);
    return NextResponse.json({
      success: false,
      message: `Error testing email configuration: ${error.message}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

