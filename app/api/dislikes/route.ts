import { NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';
import { writeClient } from '@/sanity/lib/write-client';
import { auth } from '@/auth';
import { ServerPushNotificationService } from '@/lib/notifications/serverPushNotifications';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ dislikes: 0, dislikedBy: [], likes: 0, likedBy: [] });
  }

  try {
    const data = await client.withConfig({ useCdn: false }).fetch(`*[_type == "startup" && _id == $id][0]{ dislikes, dislikedBy, likes, likedBy }`, { id });
    return NextResponse.json({ dislikes: data?.dislikes ?? 0, dislikedBy: data?.dislikedBy ?? [], likes: data?.likes ?? 0, likedBy: data?.likedBy ?? [] });
  } catch (error) {
    console.error('Error in dislikes GET:', error);
    return NextResponse.json({ dislikes: 0, dislikedBy: [], likes: 0, likedBy: [] });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const userId = session.user.id;

  if (!id) {
    return NextResponse.json({ success: false, message: 'No ID provided' }, { status: 400 });
  }

  // Check if user is banned
  const user = await client.fetch(
    `*[_type == "author" && _id == $userId][0]{ _id, bannedUntil, isBanned }`,
    { userId }
  );

  if (user?.isBanned) {
    const isCurrentlyBanned = user.bannedUntil ? new Date() < new Date(user.bannedUntil) : true;
    if (isCurrentlyBanned) {
      return NextResponse.json({ 
        success: false, 
        message: 'Account is suspended. You cannot like/dislike content.' 
      }, { status: 403 });
    }
  }

  try {
    // Fetch the current document state
    const doc = await client.withConfig({ useCdn: false }).fetch(`*[_type == "startup" && _id == $id][0]{ dislikedBy, likedBy, dislikes, likes }`, { id });

    if (!doc) {
      return NextResponse.json({ success: false, message: 'Document not found' }, { status: 404 });
    }

    let dislikedBy = doc.dislikedBy ?? [];
    let likedBy = doc.likedBy ?? [];
    let dislikes = doc.dislikes ?? 0;
    let likes = doc.likes ?? 0;

    const userHasDisliked = dislikedBy.includes(userId);
    const userHasLiked = likedBy.includes(userId);

    // Calculate the new state based on the user's action
    let analyticsAction: 'dislike' | 'undislike' | null = null;
    if (userHasDisliked) {
      // User is un-disliking
      dislikes--;
      dislikedBy = dislikedBy.filter((id: any) => id !== userId);
      analyticsAction = 'undislike';
    } else if (userHasLiked) {
      // User is switching from like to dislike
      likes--;
      dislikes++;
      likedBy = likedBy.filter((id: any) => id !== userId);
      dislikedBy.push(userId);
      analyticsAction = 'dislike';
    } else {
      // User is adding a new dislike
      dislikes++;
      dislikedBy.push(userId);
      analyticsAction = 'dislike';
    }

    // Atomically set the new state
    const result = await writeClient
      .patch(id)
      .set({
        dislikes: Math.max(0, dislikes), // Ensure counts don't go below zero
        likes: Math.max(0, likes),
        dislikedBy: dislikedBy,
        likedBy: likedBy,
      })
      .commit();

    // Record analytics event (non-blocking)
    try {
      if (analyticsAction) {
        await writeClient.create({
          _type: 'startupDislikeEvent',
          startupId: id,
          userId,
          action: analyticsAction,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('Failed to log dislike analytics event', e);
    }

    // Send push notification for new dislike (only if it's a new dislike, not un-disliking)
    if (!userHasDisliked && dislikes > doc.dislikes) {
      try {
        // Get startup owner and startup details
        const startup = await client.fetch(
          `*[_type == "startup" && _id == $startupId][0]{
            author->{_id, name, username, image},
            title
          }`,
          { startupId: id }
        );

        if (startup && startup.author?._id !== userId) {
          // Only send notification if disliker is not the startup owner
          await ServerPushNotificationService.sendNotification({
            type: 'dislike',
            recipientId: startup.author._id,
            title: 'New Dislike',
            message: `${session.user.name || session.user.username || 'Someone'} disliked your startup "${startup.title}"`,
            metadata: {
              startupId: id,
              startupTitle: startup.title,
              dislikerId: userId,
              dislikerName: session.user.name || session.user.username || 'Unknown User',
              dislikerImage: session.user.image
            }
          });
        }
      } catch (pushError) {
        console.error('Failed to send dislike push notification:', pushError);
        // Don't fail the entire request if push notification fails
      }
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Error toggling dislikes:', error);
    return NextResponse.json({ success: false, message: 'Failed to toggle dislikes' }, { status: 500 });
  }
} 