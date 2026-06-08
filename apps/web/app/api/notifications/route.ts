import { NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { client } from '@/sanity/lib/client';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    let query = `
      *[_type == "notification" && recipient._ref == $userId] | order(_createdAt desc) [${offset}...${offset + limit}] {
        _id,
        _createdAt,
        _updatedAt,
        type,
        title,
        message,
        isRead,
        isEmailSent,
        emailSentAt,
        readAt,
        sender->{
          _id,
          name,
          email,
          image
        },
        startup->{
          _id,
          title,
          slug
        },
        interestedSubmission->{
          _id,
          name,
          email
        },
        metadata
      }
    `;

    if (unreadOnly) {
      query = `
        *[_type == "notification" && recipient._ref == $userId && isRead == false] | order(_createdAt desc) [${offset}...${offset + limit}] {
          _id,
          _createdAt,
          _updatedAt,
          type,
          title,
          message,
          isRead,
          isEmailSent,
          emailSentAt,
          readAt,
          sender->{
            _id,
            name,
            email,
            image
          },
          startup->{
            _id,
            title,
            slug
          },
          interestedSubmission->{
            _id,
            name,
            email
          },
          metadata
        }
      `;
    }

    const notifications = await client.fetch(query, { userId: session.user.id });

    // Get total count for pagination
    const totalCount = await client.fetch(
      `count(*[_type == "notification" && recipient._ref == $userId])`,
      { userId: session.user.id }
    );

    const unreadCount = await client.fetch(
      `count(*[_type == "notification" && recipient._ref == $userId && isRead == false])`,
      { userId: session.user.id }
    );
    
    return NextResponse.json({
      success: true,
      notifications,
      pagination: {
        total: totalCount,
        unread: unreadCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch notifications'
    }, { status: 500 });
  }
} 