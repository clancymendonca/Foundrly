import { NextRequest, NextResponse } from 'next/server';
import { StreamChat } from 'stream-chat';

const apiKey = process.env.STREAM_API_KEY!;
const apiSecret = process.env.STREAM_API_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const { action, channelId, message, userId, notificationData } = await req.json();

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const serverClient = StreamChat.getInstance(apiKey, apiSecret);

    switch (action) {
      case 'send_notification':
        if (!channelId || !message || !userId) {
          return NextResponse.json({ 
            error: 'channelId, message, and userId are required for send_notification' 
          }, { status: 400 });
        }

        try {
          // Get the channel
          const channel = serverClient.channel('messaging', channelId);
          
          // Send a system message that will trigger push notifications
          const result = await channel.sendMessage({
            text: message,
            user_id: 'system',
            type: 'system',
            silent: false // Ensure this triggers notifications
          });


          
          return NextResponse.json({ 
            success: true, 
            messageId: result.message?.id,
            message: 'Push notification sent successfully' 
          });
        } catch (error) {
          console.error('❌ Error sending Stream Chat push notification:', error);
          return NextResponse.json({ 
            error: 'Failed to send push notification' 
          }, { status: 500 });
        }

      case 'update_user_settings':
        if (!userId || !notificationData) {
          return NextResponse.json({ 
            error: 'userId and notificationData are required for update_user_settings' 
          }, { status: 400 });
        }

        try {
          // Update user's push notification settings
          const result = await serverClient.upsertUser({
            id: userId,
            push_notifications: notificationData
          });


          
          return NextResponse.json({ 
            success: true, 
            user: result,
            message: 'User settings updated successfully' 
          });
        } catch (error) {
          console.error('❌ Error updating Stream Chat user settings:', error);
          return NextResponse.json({ 
            error: 'Failed to update user settings' 
          }, { status: 500 });
        }

      case 'get_user_settings':
        if (!userId) {
          return NextResponse.json({ 
            error: 'userId is required for get_user_settings' 
          }, { status: 400 });
        }

        try {
          // Get user's current push notification settings
          const user = await serverClient.queryUsers({ id: { $eq: userId } });
          const userData = user.users[0];
          

          
          return NextResponse.json({ 
            success: true, 
            settings: userData?.push_notifications,
            message: 'User settings retrieved successfully' 
          });
        } catch (error) {
          console.error('❌ Error getting Stream Chat user settings:', error);
          return NextResponse.json({ 
            error: 'Failed to get user settings' 
          }, { status: 500 });
        }

      case 'send_bulk_notification':
        if (!notificationData || !Array.isArray(notificationData.users)) {
          return NextResponse.json({ 
            error: 'notificationData with users array is required for send_bulk_notification' 
          }, { status: 400 });
        }

        try {
          const results = [];
          
          // Send notifications to multiple users
          for (const userData of notificationData.users) {
            try {
              const channel = serverClient.channel('messaging', userData.channelId || 'system');
              
              const result = await channel.sendMessage({
                text: userData.message,
                user_id: 'system',
                type: 'system',
                silent: false
              });

              results.push({
                userId: userData.userId,
                success: true,
                messageId: result.message?.id
              });
            } catch (error) {
              console.error(`❌ Error sending notification to user ${userData.userId}:`, error);
              results.push({
                userId: userData.userId,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          }


          
          return NextResponse.json({ 
            success: true, 
            results,
            message: 'Bulk notifications processed' 
          });
        } catch (error) {
          console.error('❌ Error sending bulk Stream Chat notifications:', error);
          return NextResponse.json({ 
            error: 'Failed to send bulk notifications' 
          }, { status: 500 });
        }

      default:
        return NextResponse.json({ 
          error: `Unknown action: ${action}` 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Error in Stream Chat push API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const serverClient = StreamChat.getInstance(apiKey, apiSecret);

    try {
      // Get user's current push notification settings
      const user = await serverClient.queryUsers({ id: { $eq: userId } });
      const userData = user.users[0];
      

      
      return NextResponse.json({ 
        success: true, 
        settings: userData?.push_notifications,
        message: 'User settings retrieved successfully' 
      });
    } catch (error) {
      console.error('❌ Error getting Stream Chat user settings via GET:', error);
      return NextResponse.json({ 
        error: 'Failed to get user settings' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error in Stream Chat push API GET:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
