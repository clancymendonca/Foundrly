import { NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';
import { getSession } from '@/lib/get-session';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const query = `*[_type == "startup" && $userId in interestedBy] {
      category
    }`;

    const data = await client.fetch(query, { userId });

    // Extract unique categories
    const categories = data
      ?.map((item: any) => item.category)
      .filter((category: string, index: number, self: string[]) => 
        category && self.indexOf(category) === index
      )
      .sort() || [];

    return NextResponse.json({ 
      success: true, 
      categories: ['All', ...categories]
    });
  } catch (error) {
    console.error('Error fetching interested categories:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch categories',
      categories: ['All']
    }, { status: 500 });
  }
}


