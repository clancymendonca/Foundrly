import { NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { writeClient } from '@/sanity/lib/write-client';
import { client } from '@/sanity/lib/client';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { notificationId, markAllAsRead } = await req.json();

    if (markAllAsRead) {
      // First, get all unread notification IDs for the current user
      const unreadNotificationIds = await client.fetch(
        `*[_type == "notification" && recipient._ref == $userId && isRead == false]._id`,
        { userId: session.user.id }
      );

      if (unreadNotificationIds.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No unread notifications to mark as read'
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
        message: `Marked ${unreadNotificationIds.length} notifications as read`
      });
    } else if (notificationId) {
      // Mark specific notification as read
      const result = await writeClient
        .patch(notificationId)
        .set({
          isRead: true,
          readAt: new Date().toISOString(),
        })
        .commit();

      return NextResponse.json({
        success: true,
        message: 'Notification marked as read'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Notification ID is required'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to mark notification as read'
    }, { status: 500 });
  }
}
