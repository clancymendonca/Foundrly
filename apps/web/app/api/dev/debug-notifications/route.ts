import { NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { client } from '@/sanity/lib/client';
import { devOnlyGuard } from '@/lib/dev-only';

export async function GET(req: Request) {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    
    // Get total notifications
    const totalCount = await client.fetch(
      `count(*[_type == "notification" && recipient._ref == $userId])`,
      { userId }
    );

    // Get unread notifications count
    const unreadCount = await client.fetch(
      `count(*[_type == "notification" && recipient._ref == $userId && isRead == false])`,
      { userId }
    );

    // Get read notifications count
    const readCount = await client.fetch(
      `count(*[_type == "notification" && recipient._ref == $userId && isRead == true])`,
      { userId }
    );

    // Get some sample unread notifications
    const sampleUnread = await client.fetch(
      `*[_type == "notification" && recipient._ref == $userId && isRead == false] | order(_createdAt desc) [0...5] {
        _id,
        _createdAt,
        type,
        title,
        message,
        isRead,
        readAt
      }`,
      { userId }
    );

    // Get some sample read notifications
    const sampleRead = await client.fetch(
      `*[_type == "notification" && recipient._ref == $userId && isRead == true] | order(_createdAt desc) [0...5] {
        _id,
        _createdAt,
        type,
        title,
        message,
        isRead,
        readAt
      }`,
      { userId }
    );

    return NextResponse.json({
      success: true,
      debug: {
        userId,
        totalCount,
        unreadCount,
        readCount,
        sampleUnread,
        sampleRead
      }
    });

  } catch (error) {
    console.error('Error debugging notifications:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to debug notifications',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

