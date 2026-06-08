import { NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { writeClient } from '@/sanity/lib/write-client';

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { submissionId, notes } = await req.json();

    if (!submissionId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing submission ID' 
      }, { status: 400 });
    }

    const result = await writeClient
      .patch(submissionId)
      .set({ notes: notes || '' })
      .commit();

    return NextResponse.json({ 
      success: true, 
      message: 'Notes updated successfully',
      result 
    });

  } catch (error) {
    console.error('Error updating notes:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to update notes' 
    }, { status: 500 });
  }
}
