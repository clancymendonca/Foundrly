import { NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';
import { AUTHOR_BY_ID_QUERY } from '@/sanity/lib/queries';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Validate request method
    if (req.method !== 'GET') {
      return NextResponse.json({ 
        error: 'Method not allowed' 
      }, { status: 405 });
    }

    // Validate params
    let id;
    try {
      const resolvedParams = await params;
      id = resolvedParams.id;
    } catch (error) {
      return NextResponse.json({ 
        error: 'Invalid user ID' 
      }, { status: 400 });
    }

    if (!id) {
      return NextResponse.json({ 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    // Fetch user data with resolved followers/following
    let user;
    try {
      user = await client.fetch(AUTHOR_BY_ID_QUERY, { id });
    } catch (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch user data' 
      }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    const response = { 
      followers: Array.isArray(user.followers) ? user.followers : [], 
      following: Array.isArray(user.following) ? user.following : [] 
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error in user resolved API:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred. Please try again later.' 
    }, { status: 500 });
  }
} 