import { NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';
import { getSession } from '@/lib/get-session';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = session.user.id;
  const category = searchParams.get('category');
  const sortBy = searchParams.get('sortBy') || 'newest';

  try {
    let query = `*[_type == "startup" && $userId in interestedBy] | order(_createdAt desc) {
      _id, 
      title, 
      slug,
      _createdAt,
      author -> {
        _id, name, image, bio
      }, 
      views,
      description,
      category,
      image,
      likes,
      dislikes,
      "commentsCount": count(comments),
      buyMeACoffeeUsername,
      interestedBy
    }`;

    // Add category filter if specified
    if (category && category !== 'All') {
      query = `*[_type == "startup" && $userId in interestedBy && category == $category] | order(_createdAt desc) {
        _id, 
        title, 
        slug,
        _createdAt,
        author -> {
          _id, name, image, bio
        }, 
        views,
        description,
        category,
        image,
        likes,
        dislikes,
        "commentsCount": count(comments),
        buyMeACoffeeUsername,
        interestedBy
      }`;
    }

    // Apply sorting
    if (sortBy === 'oldest') {
      query = query.replace('order(_createdAt desc)', 'order(_createdAt asc)');
    }

    const data = await client.fetch(query, { userId, category });

    return NextResponse.json({ 
      success: true, 
      startups: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Error fetching interested startups:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch interested startups',
      startups: [],
      count: 0
    }, { status: 500 });
  }
}


