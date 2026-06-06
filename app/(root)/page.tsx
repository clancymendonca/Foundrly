import SearchForm from "@/components/search/SearchForm";
import StartupCard, { StartupTypeCard } from "@/components/startup/StartupCard";
import { STARTUPS_SORTED_QUERY } from "@/sanity/lib/queries";
import { sanityFetch, SanityLive } from "@/sanity/lib/live";
import { auth } from "@/auth";
import FilterDropdown from "@/components/search/FilterDropdown";
import AIRecommendations from "@/components/ai/AIRecommendations";
import { AIService } from "@/lib/ai-services";
import SearchToast from "@/components/search/SearchToast";
 

export default async function Home({searchParams}:{
  searchParams: Promise<{ query?:string, filter?:string }>
}) {
  const query = await (await searchParams).query;
  const filter = await (await searchParams).filter;
  const params = {search: query || null};
  const session = await auth();

  let posts: StartupTypeCard[] = [];
  let aiSearchReasons: string[] = [];
  let aiSearchConfidence: number | undefined = undefined;

  if (query) {
    // Use AI-powered semantic search if query is present
    try {
      const aiService = new AIService();
      const aiResult = await aiService.semanticSearch(query, 12);
      aiSearchReasons = aiResult.reasons;
      aiSearchConfidence = aiResult.confidence;

      // Fetch full startup data from Sanity using IDs
      const startupIds = aiResult.startups?.map((s: any) => s._id).filter(Boolean) || [];
      if (startupIds.length > 0) {
        const fullData = await sanityFetch({
          query: `*[_type == "startup" && _id in $startupIds] {
            _id,
            title,
            description,
            category,
            pitch,
            author->{_id, name, image},
            _createdAt,
            views,
            likes,
            dislikes,
            image,
          }`,
          params: { startupIds }
        });
        posts = fullData.data;

        // Sort/filter posts according to selected filter
        switch (filter) {
          case 'popular':
            posts = posts.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
            break;
          case 'viewed':
            posts = posts.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
            break;
          case 'liked':
            posts = posts.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
            break;
          case 'commented':
            // If you have a comments count, sort by it; otherwise, leave as is
            break;
          default:
            posts = posts.sort((a, b) => new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime());
        }
      } else {
        posts = [];
      }
    } catch (err) {
      // fallback to normal search if AI fails
      const selectedQuery = STARTUPS_SORTED_QUERY(filter || 'recent');
      const {data} = await sanityFetch({query: selectedQuery, params});
      posts = data;
    }
  } else {
    // Default: normal search/filter
    const selectedQuery = STARTUPS_SORTED_QUERY(filter || 'recent');
    const {data} = await sanityFetch({query: selectedQuery, params});
    posts = data;
  }

  return (
    <>
      
      <section className="blue_container">
        <h1 className="heading">pitch your startup,<br/> Connect with enterpreneurs</h1>
        <p className="sub-heading !max-w-3xl">Submit Ideas, Vote on Pitches, and Get Noticed in Virtual Competition</p>
        <SearchForm query={query} />
        <SearchToast query={query} aiSearchReasons={aiSearchReasons} postCount={posts.length} />
      </section>

      {/* AI Recommendations above filters */}
      {!query && (
        <section className="section_container">
          <AIRecommendations limit={6} />
        </section>
      )}


      <section className="section_container">
        <div className="flex items-center justify-between">
          {query && aiSearchReasons.length > 0 ? (
            <div
              className="mb-4 px-0 py-2 flex flex-col gap-1 w-full"
            >
              {aiSearchReasons.map((reason, idx) => (
                <h2
                  key={idx}
                  className="text-30-semibold text-blue-700 leading-tight tracking-tight font-semibold"
                  style={{marginBottom: '0.25rem'}}
                >
                  {reason}
                </h2>
              ))}
              {typeof aiSearchConfidence === 'number' && (
                <span className="text-base text-blue-500 font-semibold mt-1">
                  AI Confidence: {(aiSearchConfidence * 100).toFixed(1)}%
                </span>
              )}
            </div>
          ) : (
            <p className="text-30-semibold">
              {getFilterTitle(filter)}
            </p>
          )}
          <FilterDropdown />
        </div>

  <ul className="mt-7 card_grid">
          {posts?.length > 0 ? (
            posts.map((post: StartupTypeCard, index: number) => (
              <StartupCard key={post?._id} post={post} isLoggedIn={!!session} userId={session?.user?.id} />
            ))
          ) : (
            <p className="no-results">
              No startups found
            </p>
          )}
        </ul>
      </section>

      <SanityLive />
    </>
  );
}

function getFilterTitle(filter?: string): string {
  switch (filter) {
    case 'popular':
      return 'Most Popular Startups';
    case 'viewed':
      return 'Most Viewed Startups';
    case 'liked':
      return 'Most Liked Startups';
    case 'commented':
      return 'Most Commented Startups';
    default:
      return 'Most Recent Startups';
  }
}
