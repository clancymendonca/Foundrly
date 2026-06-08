import { NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';
import { SUGGESTED_USERS_QUERY, CURRENT_USER_FOLLOWERS_QUERY } from '@/sanity/lib/queries';

export async function GET(req: Request) {
  try {
    // Validate request method
    if (req.method !== 'GET') {
      return NextResponse.json({ 
        error: 'Method not allowed' 
      }, { status: 405 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const currentUserId = searchParams.get('currentUserId');
    const currentUserFollowingParam = searchParams.get('currentUserFollowing');

    if (!currentUserId) {
      return NextResponse.json({ 
        error: 'Current user ID is required' 
      }, { status: 400 });
    }

    // Parse currentUserFollowing array
    let followingArray: string[] = [];
    if (currentUserFollowingParam) {
      try {
        followingArray = JSON.parse(currentUserFollowingParam);
      } catch (error) {
        console.error('Error parsing currentUserFollowing:', error);
      }
    }

    // Fetch current user's followers and following
    let currentUserData;
    try {
      currentUserData = await client.fetch(CURRENT_USER_FOLLOWERS_QUERY, { 
        currentUserId 
      });
    } catch (error) {
      console.error('Error fetching current user data:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch user data' 
      }, { status: 500 });
    }

    // Fetch all potential suggested users
    let suggestedUsers;
    try {
      suggestedUsers = await client.fetch(SUGGESTED_USERS_QUERY, { 
        currentUserId,
        currentUserFollowing: followingArray
      });
    } catch (error) {
      console.error('Error fetching suggested users:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch suggested users' 
      }, { status: 500 });
    }

    // Filter and categorize users
    const allUsers = [];
    const currentUserFollowers = currentUserData?.followers || [];
    const currentUserFollowingList = currentUserData?.following || [];
    
    // Create sets for faster lookup
    const followerIds = new Set(currentUserFollowers.map((f: any) => f._id));
    const followingIds = new Set(currentUserFollowingList.map((f: any) => f._id));

    suggestedUsers.forEach((user: any) => {
      if (!user || !user._id || !user.name || !user.username || user._id === currentUserId) {
        return;
      }

      let type = 'other';
      
      // Check if this user follows the current user
      if (followerIds.has(user._id)) {
        // Check if it's a mutual (current user also follows them)
        if (followingIds.has(user._id)) {
          type = 'mutual';
        } else {
          type = 'follower';
        }
      }

      allUsers.push({ ...user, type });
    });

    // Sort by priority: followers first, then mutuals, then others
    allUsers.sort((a, b) => {
      const priority = { follower: 3, mutual: 2, other: 1 };
      return priority[b.type as keyof typeof priority] - priority[a.type as keyof typeof priority];
    });

    // Limit to maxResults (default 10)
    const maxResults = parseInt(searchParams.get('limit') || '10');
    const limitedUsers = allUsers.slice(0, maxResults);

    return NextResponse.json({ 
      users: limitedUsers,
      count: limitedUsers.length,
      breakdown: {
        followers: limitedUsers.filter(u => u.type === 'follower').length,
        mutuals: limitedUsers.filter(u => u.type === 'mutual').length,
        others: limitedUsers.filter(u => u.type === 'other').length
      }
    });
  } catch (error) {
    console.error('Unexpected error in suggested users API:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred. Please try again later.' 
    }, { status: 500 });
  }
} 