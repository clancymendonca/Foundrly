import { NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { writeClient } from '@/sanity/lib/write-client';

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { submissionId } = await req.json();

    if (!submissionId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing submission ID' 
      }, { status: 400 });
    }

    const result = await writeClient.delete(submissionId);

    return NextResponse.json({ 
      success: true, 
      message: 'Submission deleted successfully',
      result 
    });

  } catch (error) {
    console.error('Error deleting submission:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to delete submission' 
    }, { status: 500 });
  }
}
