import { NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';
import { writeClient } from '@/sanity/lib/write-client';
import { getSession } from '@/lib/get-session';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ savedBy: [] });
  }

  try {
    const data = await client.withConfig({ useCdn: false }).fetch(`*[_type == "startup" && _id == $id][0]{ savedBy }`, { id });
    return NextResponse.json({ savedBy: data?.savedBy ?? [] });
  } catch (error) {
    console.error('Error in saved GET:', error);
    return NextResponse.json({ savedBy: [] });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
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
        message: 'Account is suspended. You cannot save content.' 
      }, { status: 403 });
    }
  }

  try {
    // Fetch the current document state
    const doc = await client.withConfig({ useCdn: false }).fetch(`*[_type == "startup" && _id == $id][0]{ savedBy }`, { id });

    if (!doc) {
      return NextResponse.json({ success: false, message: 'Document not found' }, { status: 404 });
    }

    let savedBy = doc.savedBy ?? [];
    const userHasSaved = savedBy.includes(userId);

    // Toggle save state
    if (userHasSaved) {
      // User is un-saving
      savedBy = savedBy.filter((id: any) => id !== userId);
    } else {
      // User is saving
      savedBy.push(userId);
    }

    // Atomically set the new state
    const result = await writeClient
      .patch(id)
      .set({
        savedBy: savedBy,
      })
      .commit();

    return NextResponse.json({ 
      success: true, 
      saved: !userHasSaved,
      savedBy: savedBy,
      ...result 
    });
  } catch (error) {
    console.error('Error toggling save:', error);
    return NextResponse.json({ success: false, message: 'Failed to toggle save' }, { status: 500 });
  }
}
