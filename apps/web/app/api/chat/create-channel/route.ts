import { NextRequest, NextResponse } from 'next/server';
import { StreamChat } from 'stream-chat';
import { client } from '@/sanity/lib/client';
import { isCurrentlyBanned } from '@/sanity/lib/moderation';

const apiKey = process.env.STREAM_API_KEY!;
const apiSecret = process.env.STREAM_API_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const { userId, memberIds, channelData } = await req.json();

    console.log('Creating channel with:', { userId, memberIds, channelData });

    if (!userId || !memberIds || !Array.isArray(memberIds) || memberIds.length < 2) {
      return NextResponse.json({ 
        error: 'Invalid request: userId and memberIds array with at least 2 members required' 
      }, { status: 400 });
    }

    // Check if the user is banned
    const user = await client.fetch(
      `*[_type == "author" && _id == $userId][0]{ _id, bannedUntil, isBanned }`,
      { userId }
    );

    if (user?.isBanned) {
      const isCurrentlyBannedUser = isCurrentlyBanned(user.bannedUntil, user.isBanned);
      if (isCurrentlyBannedUser) {
        return NextResponse.json({
          error: 'Account is suspended. You cannot send messages.',
          details: 'Your account has been suspended due to a violation of our community guidelines.'
        }, { status: 403 });
      }
    }

    // Initialize Stream Chat server client with increased timeout
    const serverClient = StreamChat.getInstance(apiKey, apiSecret, {
      timeout: 10000 // Increase timeout to 10 seconds
    });

    // Upsert all members to ensure names and images are present for new users
    try {
      const membersFromSanity = await client.fetch(
        `*[_type == "author" && _id in $ids]{ _id, name, image }`,
        { ids: memberIds }
      );
      const idToProfile = Object.fromEntries(
        (membersFromSanity || []).map((u: any) => [u._id, u])
      );
      await serverClient.upsertUsers(
        memberIds.map((id: string) => ({
          id,
          name: idToProfile[id]?.name,
          image: idToProfile[id]?.image,
        }))
      );
    } catch (e) {
      console.error('Failed to upsert Stream users for channel creation', e);
    }

    // Create a unique channel ID without colons (Stream Chat restriction)
    const channelId = `messaging-${memberIds.sort().join('-')}`;
    console.log('Generated channel ID:', channelId);

    // Create the channel with retry logic
    let channel;
    let retries = 3;
    
    while (retries > 0) {
      try {
        channel = serverClient.channel('messaging', channelId, {
          members: memberIds,
          created_by: { id: userId }, // Required for server-side auth
          ...channelData
        });

        console.log('Channel object created, attempting to create on Stream... (attempts left:', retries, ')');

        // Create the channel on Stream
        await channel.create();
        
        console.log('Channel created successfully:', channelId);
        break; // Success, exit retry loop
        
      } catch (error) {
        retries--;
        console.error(`Channel creation attempt failed (${retries} retries left):`, error.message);
        
        if (retries === 0) {
          // Try fallback approach with minimal channel data
          try {
            console.log('Trying fallback approach with minimal channel data...');
            channel = serverClient.channel('messaging', channelId, {
              members: memberIds,
              created_by: { id: userId } // Required for server-side auth
            });
            await channel.create();
            console.log('Fallback channel created successfully:', channelId);
          } catch (fallbackError) {
            console.error('Fallback approach also failed:', fallbackError.message);
            throw error; // Throw original error
          }
        }
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json({ 
      channelId: channelId,
      success: true 
    });
  } catch (error) {
    console.error('Error creating chat channel:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json({ 
      error: 'Failed to create chat channel',
      details: error.message 
    }, { status: 500 });
  }
} 