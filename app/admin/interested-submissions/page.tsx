import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin-auth';
import { client } from '@/sanity/lib/client';
import { InterestedSubmission } from '@/sanity/types';
import InterestedSubmissionsManager from './InterestedSubmissionsManager';

export const dynamic = 'force-dynamic';

async function getInterestedSubmissions(): Promise<InterestedSubmission[]> {
  const submissions = await client.fetch(`
    *[_type == "interestedSubmission"] | order(submittedAt desc) {
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
      submittedAt
    }
  `);

  return submissions;
}

export default async function InterestedSubmissionsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/api/auth/signin?callbackUrl=/admin/interested-submissions');
  }

  const submissions = await getInterestedSubmissions();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Interested Users Management</h1>
        <p className="text-gray-600">Manage and track interest submissions from potential investors and partners.</p>
      </div>

      <InterestedSubmissionsManager initialSubmissions={submissions} />
    </div>
  );
}
