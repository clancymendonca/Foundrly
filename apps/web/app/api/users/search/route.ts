import { NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';
import { ALL_USERS_QUERY } from '@/sanity/lib/queries';

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
    const query = searchParams.get('q');
    const currentUserId = searchParams.get('currentUserId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ 
        users: [],
        count: 0
      });
    }

    // Create search query
    const searchQuery = `
      *[_type == "author" && _id != $currentUserId && (name match $query + "*" || username match $query + "*")] | order(_createdAt desc)[0...$limit]{
        _id,
        id,
        name,
        username,
        email,
        image,
        bio,
        followers[]->{ _id, name, username, image },
        following[]->{ _id, name, username, image }
      }
    `;

    // Fetch users
    let users;
    try {
      users = await client.fetch(searchQuery, { 
        query: query.trim(),
        currentUserId: currentUserId || 'none',
        limit
      });
    } catch (error) {
      console.error('Error searching users:', error);
      return NextResponse.json({ 
        error: 'Failed to search users' 
      }, { status: 500 });
    }

    // Filter out users without proper data
    const filteredUsers = users.filter((user: any) => 
      user && user._id && user.name && user.username
    );

    return NextResponse.json({ 
      users: filteredUsers,
      count: filteredUsers.length,
      query: query.trim()
    });
  } catch (error) {
    console.error('Unexpected error in user search API:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred. Please try again later.' 
    }, { status: 500 });
  }
} 