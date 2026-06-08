import { NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { client } from '@/sanity/lib/client';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // First, get all startups owned by the current user
    const userStartups = await client.fetch(`
      *[_type == "startup" && author._ref == $userId] {
        _id
      }
    `, { userId: session.user.id });

    const userStartupIds = userStartups.map((startup: any) => startup._id);

    // If user has no startups, return empty array
    if (userStartupIds.length === 0) {
      return NextResponse.json({ 
        success: true, 
        submissions: [] 
      });
    }

    // Fetch interested submissions only for user's startups
    const submissions = await client.fetch(`
      *[_type == "interestedSubmission" && startup._ref in $startupIds] | order(submittedAt desc) {
        _id,
        _createdAt,
        _updatedAt,
        startup->{
          _id,
          title,
          author->{
            _id,
            name,
            email
          }
        },
        startupTitle,
        user->{
          _id,
          name,
          email
        },
        userId,
        name,
        email,
        phone,
        company,
        role,
        location,
        investmentAmount,
        investmentType,
        timeline,
        preferredContact,
        linkedin,
        website,
        experience,
        message,
        howDidYouHear,
        consentToContact,
        status,
        notes,
        submittedAt
      }
    `, { startupIds: userStartupIds });
    
    return NextResponse.json({ 
      success: true, 
      submissions 
    });

  } catch (error) {
    console.error('Error fetching interested submissions:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch submissions' 
    }, { status: 500 });
  }
}
