import { NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { writeClient } from '@/sanity/lib/write-client';

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { submissionId, status } = await req.json();

    if (!submissionId || !status) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields' 
      }, { status: 400 });
    }

    const validStatuses = ['new', 'contacted', 'in-discussion', 'interested', 'not-interested', 'closed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid status' 
      }, { status: 400 });
    }

    const result = await writeClient
      .patch(submissionId)
      .set({ status })
      .commit();

    return NextResponse.json({ 
      success: true, 
      message: 'Status updated successfully',
      result 
    });

  } catch (error) {
    console.error('Error updating status:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to update status' 
    }, { status: 500 });
  }
}
