import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { writeClient } from '@/sanity/lib/write-client';
import { client } from '@/sanity/lib/client';
import { devOnlyGuard } from '@/lib/dev-only';

export async function POST(req: Request) {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    
    // First, get all unread notification IDs for the current user
    const unreadNotificationIds = await client.fetch(
      `*[_type == "notification" && recipient._ref == $userId && isRead == false]._id`,
      { userId }
    );

    if (unreadNotificationIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No unread notifications to mark as read',
        count: 0
      });
    }

    // Mark each notification as read
    const patches = unreadNotificationIds.map((id: string) =>
      writeClient.patch(id).set({
        isRead: true,
        readAt: new Date().toISOString()
      })
    );

    await Promise.all(patches.map(patch => patch.commit()));

    return NextResponse.json({
      success: true,
      message: `Marked ${unreadNotificationIds.length} notifications as read`,
      count: unreadNotificationIds.length
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
