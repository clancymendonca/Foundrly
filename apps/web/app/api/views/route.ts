import { NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';
import { writeClient } from '@/sanity/lib/write-client';
import { STARTUP_VIEWS_QUERY } from '@/sanity/lib/queries';
// View notifications disabled per request

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ views: 1 });
  }

  try {
    const data = await client.withConfig({ useCdn: false }).fetch(STARTUP_VIEWS_QUERY, { id });
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({ views: 1 });
  }
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  // const session = await auth();

  if (!id) {
    return NextResponse.json({ success: false, message: 'No ID provided' }, { status: 400 });
  }

  try {
    // Increment the views field by 1 using write client
    await writeClient
      .patch(id)
      .setIfMissing({ views: 1 })
      .inc({ views: 1 })
      .commit();

    // Fetch updated views count
    const data = await client.withConfig({ useCdn: false }).fetch(STARTUP_VIEWS_QUERY, { id });

    // View notifications disabled

    return NextResponse.json({ success: true, views: data.views });
  } catch (error) {
    console.error('Error incrementing views:', error);
    return NextResponse.json({ success: false, message: 'Failed to increment views' }, { status: 500 });
  }
}

