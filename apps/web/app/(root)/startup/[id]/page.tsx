import { Suspense } from "react";
import { client } from "@/sanity/lib/client";
import {
  PLAYLIST_BY_SLUG_QUERY,
  STARTUP_BY_ID_QUERY,
} from "@/sanity/lib/queries";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";

import markdownit from "markdown-it";
import { Skeleton } from "@/components/ui/skeleton";
import View from "@/components/shared/View";
import StartupCard, { StartupTypeCard } from "@/components/startup/StartupCard";
import StartupDetailActions from "@/components/startup/StartupDetailActions";
import StartupDetailLikes from "@/components/startup/StartupDetailLikes";
import CommentList from "@/components/comments/CommentList";
import CommentForm from "@/components/comments/CommentForm";
import CommentsSection from "@/components/comments/CommentsSection";
import BuyMeACoffeeButton from "@/components/donate/BuyMeACoffeeButton";

const md = markdownit();

export const experimental_ppr = true;

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const id = (await params).id;
  const session = await auth();

  const [post, playlistResult, userData] = await Promise.all([
    client.fetch(STARTUP_BY_ID_QUERY, { id }),
    client.fetch(PLAYLIST_BY_SLUG_QUERY, {
      slug: "editor-picks-new",
    }),
    session?.user?.id ? client.fetch(`*[_type == "author" && _id == $userId][0]{ _id, bannedUntil, isBanned }`, { userId: session.user.id }) : null,
  ]);

  if (!post) return notFound();

  const editorPosts = playlistResult?.select || [];
  const isOwner = session?.user?.id === post.author?._id;

  const parsedContent = md.render(post?.pitch || "");

  return (
    <>
      <section className="blue_container !min-h-[230px]">
        <p className="tag">{formatDate(post?._createdAt)}</p>

        <h1 className="heading">{post.title || "Untitled"}</h1>
        <p className="sub-heading !max-w-5xl">{post.description || "No description provided."}</p>
        <StartupDetailLikes
          startupId={post._id}
          isLoggedIn={!!session}
          userId={session?.user?.id}
        />
        {post.buyMeACoffeeUsername && (
          <div className="mt-4">
            <BuyMeACoffeeButton 
              username={post.buyMeACoffeeUsername}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 px-4 rounded flex items-center gap-2"
            >
              <span>☕</span> Buy Me a Coffee
            </BuyMeACoffeeButton>
          </div>
        )}
      </section>

      <section className="section_container">
        {/* Startup main image */}
        {post.image && post.image.trim() !== "" ? (
          <img
            src={post.image}
            alt="thumbnail"
            className="w-full h-auto rounded-xl"
          />
        ) : (
          <img
            src="/default-image.png"
            alt="thumbnail"
            className="w-full h-auto rounded-xl"
          />
        )}

        <div className="space-y-5 mt-10 max-w-4xl mx-auto">
          <div className="flex-between gap-5">
            <Link
              href={`/user/${post.author?._id || ""}`}
              className="flex gap-2 items-center mb-3"
            >
              {/* Author avatar image */}
              {post.author?.image && post.author.image.trim() !== "" ? (
                <Image
                  src={post.author.image}
                  alt="avatar"
                  width={64}
                  height={64}
                  className="rounded-full drop-shadow-lg"
                />
              ) : (
                <Image
                  src="/default-avatar.png"
                  alt="avatar"
                  width={64}
                  height={64}
                  className="rounded-full drop-shadow-lg"
                />
              )}
              <div>
                <p className="text-20-medium">{post.author?.name || "Unknown"}</p>
                <p className="text-16-medium !text-black-300">
                  @{post.author?.username || "unknown"}
                </p>
              </div>
            </Link>

            <p className="category-tag">{post.category || "Uncategorized"}</p>
          </div>

          <h3 className="text-30-bold">Pitch Details</h3>
          {parsedContent && post.pitch ? (
            <article
              className="prose max-w-4xl font-work-sans break-all"
              dangerouslySetInnerHTML={{ __html: parsedContent }}
            />
          ) : (
            <p className="no-result">No details provided</p>
          )}

          <StartupDetailActions
            startupId={post._id}
            startupTitle={post.title || "Untitled"}
            userId={post.author?._id || ""}
            isOwner={isOwner}
          />
        </div>

        <hr className="divider" />

        {editorPosts?.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <p className="text-30-semibold">Editor Picks</p>

            <ul className="mt-7 card_grid-sm">
              {editorPosts.map((post: StartupTypeCard, i: number) => (
                <StartupCard key={i} post={post} />
              ))}
            </ul>
          </div>
        )}

        <CommentsSection 
          startupId={id} 
          isLoggedIn={!!session} 
          userId={session?.user?.id}
          userData={userData}
        />

        <Suspense fallback={<Skeleton className="view_skeleton" />}>
          <View id={id} />
        </Suspense>
      </section>
    </>
  );
};

export default Page;