import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ startupId: string }> }
) {
  try {
    const { startupId } = await params;

    if (!startupId) {
      return NextResponse.json({ error: 'Startup ID is required' }, { status: 400 });
    }

    // Fetch the startup data with all engagement metrics
    const startup = await client.fetch(`
      *[_type == "startup" && _id == $startupId][0] {
        _id,
        title,
        likes,
        dislikes,
        views,
        commentsCount,
        savedBy,
        interestedBy
      }
    `, { startupId });

    if (!startup) {
      return NextResponse.json({ error: 'Startup not found' }, { status: 404 });
    }

    // Calculate engagement metrics
    const engagementData = {
      likes: startup.likes || 0,
      dislikes: startup.dislikes || 0,
      comments: startup.commentsCount || 0,
      views: startup.views || 0,
      saved: startup.savedBy?.length || 0,
      interested: startup.interestedBy?.length || 0
    };

    return NextResponse.json(engagementData);
  } catch (error) {
    console.error('Error fetching startup engagement data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch engagement data' },
      { status: 500 }
    );
  }
}
