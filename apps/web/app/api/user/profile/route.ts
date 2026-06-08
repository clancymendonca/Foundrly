import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { writeClient } from '@/sanity/lib/write-client';
import { logProfileChange } from '@/sanity/lib/account-history';

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, bio, image } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Name is required and must be a non-empty string' 
      }, { status: 400 });
    }

    // Validate optional fields
    if (bio !== undefined && (typeof bio !== 'string' || bio.length > 200)) {
      return NextResponse.json({ 
        error: 'Bio must be a string with maximum 200 characters' 
      }, { status: 400 });
    }

    if (image !== undefined && typeof image !== 'string') {
      return NextResponse.json({ 
        error: 'Image must be a string URL' 
      }, { status: 400 });
    }

    // Get current user data to compare changes
    const currentUser = await writeClient.fetch(
      `*[_type == "author" && _id == $userId][0]{
        name,
        bio,
        image
      }`,
      { userId: session.user.id }
    );

    // Update user profile in Sanity
    const updateData: any = {
      name: name.trim()
    };

    if (bio !== undefined) {
      updateData.bio = bio.trim();
    }

    if (image !== undefined) {
      updateData.image = image;
    }

    const result = await writeClient
      .patch(session.user.id)
      .set(updateData)
      .commit();

    // Log changes to account history
    const requestInfo = {
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      userAgent: req.headers.get('user-agent'),
      sessionId: session.user.id
    };

    // Log name change if it changed
    if (currentUser?.name !== name.trim()) {
      await logProfileChange(
        session.user.id,
        name.trim(),
        'name_change',
        currentUser?.name || '',
        name.trim(),
        requestInfo
      );
    }

    // Log bio change if it changed
    if (bio !== undefined && currentUser?.bio !== bio.trim()) {
      await logProfileChange(
        session.user.id,
        name.trim(),
        'bio_change',
        currentUser?.bio || '',
        bio.trim(),
        requestInfo
      );
    }

    // Log image change if it changed
    if (image !== undefined && currentUser?.image !== image) {
      await logProfileChange(
        session.user.id,
        name.trim(),
        'image_change',
        currentUser?.image || '',
        image,
        requestInfo
      );
    }

    return NextResponse.json({
      success: true,
      user: result,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ 
      error: 'Failed to update profile' 
    }, { status: 500 });
  }
}
