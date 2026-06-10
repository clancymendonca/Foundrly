import { NextResponse } from 'next/server';
import { writeClient } from '@/sanity/lib/write-client';
import { canUserPerformAction } from '@/lib/ban-checks';
import { createFollowNotification } from '@/sanity/lib/notifications';
import { ServerPushNotificationService } from '@/lib/notifications/serverPushNotifications';
import { awardBadgesForAction } from '@/lib/badges/award-badges-for-action';

export async function POST(req: Request) {
  try {
    // Validate request method
    if (req.method !== 'POST') {
      return NextResponse.json({ 
        success: false, 
        message: 'Method not allowed' 
      }, { status: 405 });
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid JSON in request body' 
      }, { status: 400 });
    }

    const { profileId, currentUserId, action } = body;
    console.log('API /api/follow called:', { profileId, currentUserId, action });

    // Validate required fields
    if (!profileId || !currentUserId || !action) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields: profileId, currentUserId, or action' 
      }, { status: 400 });
    }

    if (!['follow', 'unfollow', 'remove_follower'].includes(action)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid action. Must be "follow", "unfollow", or "remove_follower"' 
      }, { status: 400 });
    }

    // Check if user is banned
    const banCheck = await canUserPerformAction(currentUserId);
    if (!banCheck.canPerform) {
      return NextResponse.json({ 
        success: false, 
        message: banCheck.message 
      }, { status: 403 });
    }

    // Validate token
    if (!writeClient.config().token) {
      return NextResponse.json({ 
        success: false, 
        message: 'Server configuration error' 
      }, { status: 500 });
    }

    // Single optimized query to get both users with their follow status
    let profile, currentUser;
    try {
      const query = `{
        "profile": *[_type == "author" && _id == $profileId][0]{
          _id,
          name,
          username,
          image,
          followers[]->{ _id, name, username, image }
        },
        "currentUser": *[_type == "author" && _id == $currentUserId][0]{
          _id,
          name,
          username,
          image,
          following[]->{ _id, name, username, image }
        }
      }`;
      
      const result = await writeClient.fetch(query, { profileId, currentUserId });
      profile = result.profile;
      currentUser = result.currentUser;
    } catch (error) {
      console.error('Error fetching documents:', error);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to fetch user data' 
      }, { status: 500 });
    }

    if (!profile || !currentUser) {
      return NextResponse.json({ 
        success: false, 
        message: 'One or both users not found' 
      }, { status: 404 });
    }

    const alreadyFollowing = Array.isArray(profile?.followers) && profile.followers.some((follower: any) => follower._id === currentUserId);
    const alreadyInFollowing = Array.isArray(currentUser?.following) && currentUser.following.some((following: any) => following._id === profileId);

    const profilePatch = writeClient.patch(profileId);
    const currentUserPatch = writeClient.patch(currentUserId);

    // Prepare response data for optimistic updates
    let updatedFollowers = Array.isArray(profile?.followers) ? [...profile.followers] : [];
    let updatedFollowing = Array.isArray(currentUser?.following) ? [...currentUser.following] : [];

    if (action === 'follow') {
      if (!alreadyFollowing) {
        profilePatch.setIfMissing({ followers: [] }).append('followers', [{ 
          _type: 'reference', 
          _ref: currentUserId,
          _key: `follower_${currentUserId}`
        }]);
        // Add to optimistic response
        updatedFollowers.push({
          _id: currentUserId,
          name: currentUser.name,
          username: currentUser.username,
          image: currentUser.image
        });
      }
      if (!alreadyInFollowing) {
        currentUserPatch.setIfMissing({ following: [] }).append('following', [{ 
          _type: 'reference', 
          _ref: profileId,
          _key: `following_${profileId}`
        }]);
        // Add to optimistic response
        updatedFollowing.push({
          _id: profileId,
          name: profile.name,
          username: profile.username,
          image: profile.image
        });
      }
    } else if (action === 'remove_follower') {
      profilePatch.unset([`followers[_ref=="${currentUserId}"]`]);
      currentUserPatch.unset([`following[_ref=="${profileId}"]`]);
      // Remove from optimistic response
      updatedFollowers = updatedFollowers.filter((follower: any) => follower._id !== currentUserId);
      updatedFollowing = updatedFollowing.filter((following: any) => following._id !== profileId);
    } else {
      profilePatch.unset([`followers[_ref=="${currentUserId}"]`]);
      currentUserPatch.unset([`following[_ref=="${profileId}"]`]);
      // Remove from optimistic response
      updatedFollowers = updatedFollowers.filter((follower: any) => follower._id !== currentUserId);
      updatedFollowing = updatedFollowing.filter((following: any) => following._id !== profileId);
    }

    let result;
    try {
      result = await writeClient.transaction()
        .patch(profilePatch)
        .patch(currentUserPatch)
        .commit();
    } catch (error) {
      console.error('Sanity mutation error:', error);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to update follow status in database' 
      }, { status: 500 });
    }

    // Create notification for new follow (only if it's a new follow)
    if (action === 'follow' && !alreadyFollowing) {
      try {
        await createFollowNotification(
          currentUserId,
          profileId,
          currentUser.name || currentUser.username || 'Unknown User',
          currentUser.image
        );

        // Send push notification for new follow
        try {
          await ServerPushNotificationService.sendNotification({
            type: 'follow',
            recipientId: profileId,
            title: 'New Follower',
            message: `${currentUser.name || currentUser.username || 'Someone'} started following you`,
            metadata: {
              followerId: currentUserId,
              followerName: currentUser.name || currentUser.username || 'Unknown User',
              followerImage: currentUser.image,
              followerUsername: currentUser.username
            }
          });
        } catch (pushError) {
          console.error('Failed to send follow push notification:', pushError);
        }
      } catch (notificationError) {
        console.error('Failed to create follow notification:', notificationError);
        // Don't fail the entire request if notification creation fails
      }

      void awardBadgesForAction(currentUserId, 'users_followed').catch(console.error);
      void awardBadgesForAction(profileId, 'followers_gained').catch(console.error);
    }

    // Return optimistic data immediately without additional database calls
    return NextResponse.json({
      success: true,
      followers: updatedFollowers,
      following: updatedFollowing,
      action,
      alreadyFollowing: action === 'follow' ? true : false
    });
  } catch (error) {
    console.error('Unexpected error in follow API:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'An unexpected error occurred. Please try again later.' 
    }, { status: 500 });
  }
}