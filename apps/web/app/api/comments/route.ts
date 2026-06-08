import { NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';
import { writeClient } from '@/sanity/lib/write-client';
import { getSession } from '@/lib/get-session';
import { v4 as uuidv4 } from 'uuid';
import { createCommentNotification, createReplyNotification } from '@/sanity/lib/notifications';
import { ServerPushNotificationService } from '@/lib/notifications/serverPushNotifications';
import { checkUserContentModeration } from '@/lib/content-moderation-guard';

/**
 * Fetches and returns the comment reply tree for a startup.
 *
 * Builds a list of root comments each containing nested `replies` arrays sorted by `createdAt` ascending.
 *
 * @returns An object with a `comments` array containing root comments with nested `replies` sorted by `createdAt` (oldest first); returns `{ comments: [] }` if `startupId` is missing or on error.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const startupId = searchParams.get('startupId');

  if (!startupId) {
    return NextResponse.json({ comments: [] });
  }

  try {
    // Fetch all comments for the startup (flat list)
    const allComments = await client
      .withConfig({ useCdn: false })
      .fetch(
        `*[_type == "comment" && startup._ref == $startupId]{
          _id, text, createdAt, author->{_id, name, username, image}, likes, dislikes, likedBy, dislikedBy, deleted, parent, replies
        }`,
        { startupId }
      );

    // Build a map of comments by _id
    const commentMap = new Map();
    allComments.forEach((c: any) => {
      commentMap.set(c._id, { ...c, replies: [] });
    });

    // Build the tree
    const rootComments: any[] = [];
    allComments.forEach((c: any) => {
      if (c.parent && c.parent._ref) {
        const parent = commentMap.get(c.parent._ref);
        if (parent) {
          parent.replies.push(commentMap.get(c._id));
        }
      } else {
        rootComments.push(commentMap.get(c._id));
      }
    });

    // Optionally, sort replies by createdAt ascending (oldest first)
    function sortReplies(comments: any[]) {
      comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      comments.forEach(c => sortReplies(c.replies));
    }
    sortReplies(rootComments);

    return NextResponse.json({ comments: rootComments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ comments: [] });
  }
}

/**
 * Handle POST requests to create a top-level comment, reply to a comment, or register a like/dislike for a comment; requires an authenticated, non-suspended user.
 *
 * Performs a ban check and content moderation for created comments/replies, updates or creates the relevant Sanity documents, patches parent/startup documents as needed, and triggers non-fatal notification and analytics side effects. Supports the `action` values `'create'`, `'reply'`, `'like'`, and `'dislike'`.
 *
 * @returns A JSON response object. On success: `{ success: true, comment?: <created comment>, reply?: <created reply> }`. On failure: `{ success: false, message: string }` with an appropriate HTTP status (e.g., 400 for validation errors, 401 for unauthenticated, 403 for bans or moderation rejections, 500 for server errors).
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized - Please log in to comment' }, { status: 401 });
  }

  // Check if user is banned
  const user = await client.fetch(
    `*[_type == "author" && _id == $userId][0]{ _id, bannedUntil, isBanned }`,
    { userId: session.user.id }
  );

  if (user?.isBanned) {
    const isCurrentlyBanned = user.bannedUntil ? new Date() < new Date(user.bannedUntil) : true;
    if (isCurrentlyBanned) {
      return NextResponse.json({ 
        success: false, 
        message: 'Account is suspended. You cannot post comments.' 
      }, { status: 403 });
    }
  }

  try {
    const body = await req.json();
    const text: string | undefined = body.text;
    const startupId: string | undefined = body.startupId;
    const parentId: string | undefined = body.parentId;
    const action: 'reply' | 'like' | 'dislike' | 'create' | undefined = body.action ?? 'create';
    const commentId: string | undefined = body.commentId;
    const bodyUserId: string | undefined = body.userId;
    if (action === 'reply') {
      // Create reply comment
      if (!text || !startupId || !parentId) {
        return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
      }

      const moderation = await checkUserContentModeration(text, {
        userId: session.user.id,
        userName: session.user.name || session.user.username || 'Unknown User',
        itemType: 'comment',
      });
      if (!moderation.allowed) {
        return NextResponse.json({ success: false, message: moderation.message }, { status: 403 });
      }

      const reply = await writeClient.create({
        _type: 'comment',
        text,
        createdAt: new Date().toISOString(),
        author: { _type: 'reference', _ref: session.user.id },
        startup: { _type: 'reference', _ref: startupId },
        parent: { _type: 'reference', _ref: parentId },
      });

      
      // Patch parent comment to include reply reference
      await writeClient
        .patch(parentId)
        .setIfMissing({ replies: [] })
        .append('replies', [{ _type: 'reference', _ref: reply._id, _key: uuidv4() }])
        .commit();

      // Create notification for the parent comment author
      try {

        
        // Get parent comment author and startup details
        const parentComment = await client.fetch(
          `*[_type == "comment" && _id == $parentId][0]{
            author->{_id, name, username, image},
            startup->{_id, title},
            text
          }`,
          { parentId }
        );



        if (parentComment && parentComment.author?._id !== session.user.id) {

          
          // Create reply notification for the parent comment author
          const notificationId = await createReplyNotification(
            session.user.id, // replier
            parentComment.author._id, // parent comment author
            parentComment.startup._id, // startup ID
            parentComment.startup.title, // startup title
            session.user.name || session.user.username || 'Unknown User', // replier name
            session.user.image, // replier image
            text, // reply text
            parentComment.text // parent comment text for context
          );

          // Send push notification for reply
          try {
            await ServerPushNotificationService.sendNotification({
              type: 'comment',
              recipientId: parentComment.author._id,
              title: 'New Reply',
              message: `${session.user.name || session.user.username || 'Someone'} replied to your comment on "${parentComment.startup.title}"`,
              metadata: {
                startupId: parentComment.startup._id,
                startupTitle: parentComment.startup.title,
                commenterId: session.user.id,
                commenterName: session.user.name || session.user.username || 'Unknown User',
                commenterImage: session.user.image,
                replyText: text,
                parentCommentText: parentComment.text,
                isReply: true
              }
            });
          } catch (pushError) {
            console.error('Failed to send reply push notification:', pushError);
          }

        } else {
          // Skipping reply notification - replier is parent comment author
        }
      } catch (notificationError: any) {
        console.error('❌ Failed to create reply notification:', notificationError);
        console.error('❌ Reply notification error details:', {
          message: notificationError.message,
          stack: notificationError.stack
        });
        // Don't fail the entire request if notification creation fails
      }

      return NextResponse.json({ success: true, reply });
    } else if (action === 'like' || action === 'dislike') {
      // Like or dislike a comment
      if (!commentId || !bodyUserId) {
        return NextResponse.json({ success: false, message: 'Missing commentId or userId' }, { status: 400 });
      }
      const comment = await client.fetch(`*[_type == "comment" && _id == $id][0]{likedBy, dislikedBy, likes, dislikes}`, { id: commentId });
      let likedBy = comment.likedBy ?? [];
      let dislikedBy = comment.dislikedBy ?? [];
      let likes = comment.likes ?? 0;
      let dislikes = comment.dislikes ?? 0;
      const userHasLiked = likedBy.includes(bodyUserId);
      const userHasDisliked = dislikedBy.includes(bodyUserId);
      if (action === 'like') {
        if (userHasLiked) {
          likedBy = likedBy.filter((id: any) => id !== bodyUserId);
        } else if (userHasDisliked) {
          dislikedBy = dislikedBy.filter((id: any) => id !== bodyUserId);
          likedBy.push(bodyUserId);
        } else {
          likedBy.push(bodyUserId);
        }
      } else if (action === 'dislike') {
        if (userHasDisliked) {
          dislikedBy = dislikedBy.filter((id: any) => id !== bodyUserId);
        } else if (userHasLiked) {
          likedBy = likedBy.filter((id: any) => id !== bodyUserId);
          dislikedBy.push(bodyUserId);
        } else {
          dislikedBy.push(bodyUserId);
        }
      }
      likedBy = Array.from(new Set(likedBy));
      dislikedBy = Array.from(new Set(dislikedBy));
      likes = Math.max(0, likedBy.length);
      dislikes = Math.max(0, dislikedBy.length);
      await writeClient.patch(commentId)
        .set({
          likes,
          dislikes,
          likedBy,
          dislikedBy
        })
        .commit();

      // Send notification for comment like (only for new likes, not unlikes)
      if (action === 'like' && !userHasLiked) {
        try {
          // Get comment author and startup details
          const comment = await client.fetch(
            `*[_type == "comment" && _id == $commentId][0]{
              author->{_id, name, username, image},
              startup->{_id, title},
              text
            }`,
            { commentId }
          );

          if (comment && comment.author?._id !== userId) {
            // Only send notification if liker is not the comment author
            await ServerPushNotificationService.sendNotification({
              type: 'comment_like',
              recipientId: comment.author._id,
              title: 'Comment Liked',
              message: `${session.user.name || session.user.username || 'Someone'} liked your comment on "${comment.startup.title}"`,
              metadata: {
                startupId: comment.startup._id,
                startupTitle: comment.startup.title,
                commentId: commentId,
                commentText: comment.text,
                likerId: bodyUserId,
                likerName: session.user.name || session.user.username || 'Unknown User',
                likerImage: session.user.image
              }
            });
          }
        } catch (pushError) {
          console.error('Failed to send comment like push notification:', pushError);
        }
      }

      return NextResponse.json({ success: true });
    } else if (action === 'create') {
      // New top-level comment
      if (!text || !startupId) {
        return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
      }

      const moderation = await checkUserContentModeration(text, {
        userId: session.user.id,
        userName: session.user.name || session.user.username || 'Unknown User',
        itemType: 'comment',
      });
      if (!moderation.allowed) {
        return NextResponse.json({ success: false, message: moderation.message }, { status: 403 });
      }

      const comment = await writeClient.create({
        _type: 'comment',
        text,
        createdAt: new Date().toISOString(),
        author: { _type: 'reference', _ref: session.user.id },
        startup: { _type: 'reference', _ref: startupId },
      });
      await writeClient
        .patch(startupId)
        .setIfMissing({ comments: [] })
        .append('comments', [{ _type: 'reference', _ref: comment._id, _key: uuidv4() }])
        .commit();

      // Create notification for the startup owner
      try {

        
        // Get startup owner and startup details
        const startup = await client.fetch(
          `*[_type == "startup" && _id == $startupId][0]{
            author->{_id, name, username, image},
            title
          }`,
          { startupId }
        );



        if (startup && startup.author?._id !== session.user.id) {

          
          // Only create notification if commenter is not the startup owner
          const notificationId = await createCommentNotification(
            session.user.id, // commenter
            startup.author._id, // startup owner
            startupId,
            startup.title,
            session.user.name || session.user.username || 'Unknown User',
            session.user.image,
            text
          );

          // Send push notification for new comment
          try {
            await ServerPushNotificationService.sendNotification({
              type: 'comment',
              recipientId: startup.author._id,
              title: 'New Comment',
              message: `${session.user.name || session.user.username || 'Someone'} commented on your startup "${startup.title}"`,
              metadata: {
                startupId: startupId,
                startupTitle: startup.title,
                commenterId: session.user.id,
                commenterName: session.user.name || session.user.username || 'Unknown User',
                commenterImage: session.user.image,
                commentText: text,
                isReply: false
              }
            });
          } catch (pushError) {
            console.error('Failed to send comment push notification:', pushError);
          }

        } else {
          // Skipping notification - commenter is startup owner or startup not found
        }
      } catch (notificationError: any) {
        console.error('❌ Failed to create comment notification:', notificationError);
        console.error('❌ Notification error details:', {
          message: notificationError.message,
          stack: notificationError.stack
        });
        // Don't fail the entire request if notification creation fails
      }

      // After successful create, record analytics event (non-blocking)
      try {
        await writeClient.create({
          _type: 'startupCommentEvent',
          startupId: startupId,
          userId: session.user.id,
          action: 'comment',
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        console.error('Failed to log comment analytics event', e);
      }
      return NextResponse.json({ success: true, comment });
    }
  } catch (error) {
    console.error('Error posting comment:', error);
    return NextResponse.json({ success: false, message: 'Failed to post comment' }, { status: 500 });
  }
}

// PATCH: Edit a comment (REQUIRES AUTH)
export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { commentId, text } = await req.json();
    if (!commentId || !text) {
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
    }
    // Only allow author to edit
    const comment = await client.fetch(`*[_type == "comment" && _id == $id][0]{author->{_id}}`, { id: commentId });
    if (!comment || comment.author?._id !== session.user.id) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
    const moderation = await checkUserContentModeration(text, {
      userId: session.user.id,
      userName: session.user.name || session.user.username || 'Unknown User',
      itemType: 'comment',
      itemId: commentId,
    });
    if (!moderation.allowed) {
      return NextResponse.json({ success: false, message: moderation.message }, { status: 403 });
    }
    await writeClient.patch(commentId).set({ text }).commit();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error editing comment:', error);
    return NextResponse.json({ success: false, message: 'Failed to edit comment' }, { status: 500 });
  }
}

// DELETE: Delete a comment (REQUIRES AUTH)
export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { commentId } = await req.json();
    if (!commentId) {
      return NextResponse.json({ success: false, message: 'Missing commentId' }, { status: 400 });
    }
    // Only allow author to delete
    const comment = await client.fetch(`*[_type == "comment" && _id == $id][0]{author->{_id}, startup, parent}`, { id: commentId });
    if (!comment || comment.author?._id !== session.user.id) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
    
    // Soft delete: mark as deleted instead of removing
    await writeClient.patch(commentId).set({ deleted: true }).commit();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete comment' }, { status: 500 });
  }
} 