import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { writeClient } from '@/sanity/lib/write-client';
import { client } from '@/sanity/lib/client';
import { createInterestedSubmissionNotification } from '@/sanity/lib/notifications';
import { ServerPushNotificationService } from '@/lib/notifications/serverPushNotifications';

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { 
      startupId, 
      startupTitle, 
      userId, 
      name, 
      email, 
      phone,
      company,
      role,
      message, 
      investmentAmount,
      investmentType,
      experience,
      timeline,
      preferredContact,
      linkedin,
      website,
      location,
      howDidYouHear,
      consentToContact
    } = body;

    // Validate required fields
    if (!startupId || !name || !email || !message || !consentToContact) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields' 
      }, { status: 400 });
    }

    // Check if user is trying to show interest in their own startup
    let startup;
    try {
      startup = await client.fetch(`
        *[_type == "startup" && _id == $startupId][0] {
          _id,
          title,
          author->{
            _id,
            name,
            email
          }
        }
      `, { startupId });

      if (!startup) {
        return NextResponse.json({ 
          success: false, 
          message: 'Startup not found' 
        }, { status: 404 });
      }

      // Check if the current user is the author of the startup
      if (startup.author && startup.author._id === session.user.id) {
        return NextResponse.json({ 
          success: false, 
          message: 'You cannot show interest in your own startup' 
        }, { status: 400 });
      }
    } catch (error) {
      console.error('Error checking startup ownership:', error);
      return NextResponse.json({ 
        success: false, 
        message: 'Error validating startup ownership' 
      }, { status: 500 });
    }

    // Save the form data to Sanity database
    const submissionData = {
      _type: 'interestedSubmission',
      startup: {
        _type: 'reference',
        _ref: startupId,
      },
      startupTitle,
      userId,
      name,
      email,
      phone: phone || undefined,
      company: company || undefined,
      role: role || undefined,
      location: location || undefined,
      investmentAmount: investmentAmount || undefined,
      investmentType: investmentType || undefined,
      timeline: timeline || undefined,
      preferredContact: preferredContact || 'email',
      linkedin: linkedin || undefined,
      website: website || undefined,
      experience: experience || undefined,
      message,
      howDidYouHear: howDidYouHear || undefined,
      consentToContact,
      status: 'new',
      submittedAt: new Date().toISOString(),
    };

    // Add user reference if userId exists
    if (userId) {
      submissionData.user = {
        _type: 'reference',
        _ref: userId,
      };
    }

    const result = await writeClient.create(submissionData);

    console.log('Interested form submission saved:', {
      submissionId: result._id,
      startupId,
      startupTitle,
      userId,
      name,
      email,
      submittedAt: new Date().toISOString()
    });

    // Create notification for interested submission (following same pattern as likes/follows)
    if (startup && startup.author?._id !== userId) {
      try {
        console.log('Creating interested submission notification:', {
          interestedUserId: userId,
          startupOwnerId: startup.author._id,
          startupId,
          startupTitle,
          interestedUserName: name,
          interestedUserEmail: email,
          interestedSubmissionId: result._id
        });

        await createInterestedSubmissionNotification(
          userId, // interested user
          startup.author._id, // startup owner
          startupId,
          startupTitle,
          name, // interested user name
          email, // interested user email
          result._id, // interested submission ID
          message,
          session.user.image, // interested user image
          {
            phone,
            company,
            role,
            investmentAmount,
            investmentType,
            timeline,
            preferredContact,
            linkedin,
            website,
            experience,
            howDidYouHear
          }
        );

        console.log('Interested submission notification created successfully');

        // Send push notification
        try {
          await ServerPushNotificationService.sendNotification({
            type: 'interested',
            recipientId: startup.author._id,
            title: 'New Interest in Your Startup',
            message: `${name} submitted interest in your startup "${startupTitle}"`,
            metadata: {
              startupId,
              startupTitle,
              interestedUserId: userId,
              interestedUserName: name,
              interestedUserEmail: email,
              interestedUserImage: session.user.image,
              interestedSubmissionId: result._id,
              message
            }
          });
        } catch (pushError) {
          console.error('Failed to send interested submission push notification:', pushError);
          // Don't fail the entire request if push notification fails
        }
      } catch (notificationError) {
        console.error('Failed to create interested submission notification:', notificationError);
        // Don't fail the entire request if notification creation fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Interest submitted successfully' 
    });

  } catch (error) {
    console.error('Error processing interested form:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to process interest submission',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
