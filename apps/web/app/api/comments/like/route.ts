import { NextResponse } from 'next/server';
import { writeClient } from '@/sanity/lib/write-client';
import { getSession } from '@/lib/get-session';
import { canUserPerformAction } from '@/lib/ban-checks';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized - Please log in to like comments' }, { status: 401 });
  }

  // Check if user is banned
  const banCheck = await canUserPerformAction(session.user.id);
  if (!banCheck.canPerform) {
    return NextResponse.json({ success: false, message: banCheck.message }, { status: 403 });
  }

  try {
    const { commentId, userId } = await req.json();
    
    if (!commentId || !userId) {
      return NextResponse.json({ success: false, message: 'Missing commentId or userId' }, { status: 400 });
    }

    // Get current comment state
    const comment = await writeClient.fetch(`*[_type == "comment" && _id == $id][0]{likedBy, dislikedBy, likes, dislikes}`, { id: commentId });
    
    if (!comment) {
      return NextResponse.json({ success: false, message: 'Comment not found' }, { status: 404 });
    }

    let likedBy = comment.likedBy ?? [];
    let dislikedBy = comment.dislikedBy ?? [];
    let likes = comment.likes ?? 0;
    let dislikes = comment.dislikes ?? 0;
    
    const userHasLiked = likedBy.includes(userId);
    const userHasDisliked = dislikedBy.includes(userId);

    if (userHasLiked) {
      // Remove like
      likedBy = likedBy.filter((id: string) => id !== userId);
    } else {
      // Add like
      if (userHasDisliked) {
        // Remove dislike first
        dislikedBy = dislikedBy.filter((id: string) => id !== userId);
      }
      likedBy.push(userId);
    }

    // Ensure arrays are unique
    likedBy = Array.from(new Set(likedBy));
    dislikedBy = Array.from(new Set(dislikedBy));
    
    // Update counts
    likes = Math.max(0, likedBy.length);
    dislikes = Math.max(0, dislikedBy.length);

    // Update comment
    await writeClient.patch(commentId)
      .set({
        likes,
        dislikes,
        likedBy,
        dislikedBy
      })
      .commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error liking comment:', error);
    return NextResponse.json({ success: false, message: 'Failed to like comment' }, { status: 500 });
  }
} 