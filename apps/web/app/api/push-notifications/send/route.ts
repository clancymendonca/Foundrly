import { NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import webpush from 'web-push';

// Check if VAPID keys are configured
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || 'noreply@foundrly.com';

if (!vapidPublicKey || !vapidPrivateKey) {
  console.error('❌ VAPID keys not configured. Please set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables.');
  throw new Error('VAPID keys not configured');
}

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  `mailto:${vapidEmail}`,
  vapidPublicKey,
  vapidPrivateKey
);

export async function POST(request: Request) {
  try {
    
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscription, notification } = await request.json();
    
    if (!subscription || !notification) {
      return NextResponse.json({ 
        error: 'Missing required fields: subscription and notification' 
      }, { status: 400 });
    }



    // Use the keys directly as strings (web-push handles the conversion internally)
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    };

    // Send push notification
    const payload = JSON.stringify(notification);
    const result = await webpush.sendNotification(pushSubscription, payload);



    return NextResponse.json({
      success: true,
      message: 'Push notification sent successfully',
      statusCode: result.statusCode
    });

  } catch (error: any) {
    console.error('❌ Error sending push notification:', {
      error: error,
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to send push notification',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
} 