import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { client } from '@/sanity/lib/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const changeType = searchParams.get('changeType');

    console.log('API: Received changeType:', changeType);
    console.log('API: User ID:', session.user.id);

    // Build a simple query first
    let query = `*[_type == "accountHistory" && userId == $userId] | order(timestamp desc) [${offset}...${offset + limit}] {
      _id,
      changeType,
      timestamp,
      oldValue,
      newValue,
      startupId,
      startupTitle,
      changeDetails,
      ipAddress,
      userAgent
    }`;

    let queryParams = { userId: session.user.id };

    // Add filtering if changeType is provided
    if (changeType && changeType.trim() !== '') {
      const changeTypes = changeType.split(',').map(t => t.trim()).filter(t => t !== '');
      console.log('API: Parsed changeTypes:', changeTypes);
      
      if (changeTypes.length === 1) {
        query = `*[_type == "accountHistory" && userId == $userId && changeType == $changeType] | order(timestamp desc) [${offset}...${offset + limit}] {
          _id,
          changeType,
          timestamp,
          oldValue,
          newValue,
          startupId,
          startupTitle,
          changeDetails,
          ipAddress,
          userAgent
        }`;
        queryParams = { userId: session.user.id, changeType: changeTypes[0] };
      } else if (changeTypes.length > 1) {
        query = `*[_type == "accountHistory" && userId == $userId && changeType in $changeTypes] | order(timestamp desc) [${offset}...${offset + limit}] {
          _id,
          changeType,
          timestamp,
          oldValue,
          newValue,
          startupId,
          startupTitle,
          changeDetails,
          ipAddress,
          userAgent
        }`;
        queryParams = { userId: session.user.id, changeTypes: changeTypes };
      }
    }

    console.log('API: Final query:', query);
    console.log('API: Query params:', queryParams);

    // Execute the query
    const history = await client.fetch(query, queryParams);
    console.log('API: Results - history count:', history.length);

    return NextResponse.json({
      success: true,
      history: history || [],
      pagination: {
        total: history.length,
        limit,
        offset,
        hasMore: false
      }
    });

  } catch (error) {
    console.error('API Error details:', error);
    console.error('API Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json({ 
      error: 'Failed to fetch account history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
