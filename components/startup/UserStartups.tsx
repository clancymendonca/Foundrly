import React from "react";
import { client } from "@/sanity/lib/client";
import { STARTUPS_BY_AUTHOR_QUERY } from "@/sanity/lib/queries";
import StartupCard, { StartupTypeCard } from "@/components/startup/StartupCard";

interface UserStartupsProps {
  id: string;
  sessionId?: string;
}

const UserStartups = async ({ id, sessionId }: UserStartupsProps) => {
  const startups = await client.fetch(STARTUPS_BY_AUTHOR_QUERY, { id });

  return (
    <>
      {startups.length > 0 ? (
        startups.map((startup: StartupTypeCard) => (
          <StartupCard 
            key={startup._id} 
            post={startup} 
            isOwner={sessionId === id}
          />
        ))
      ) : (
        <p className="no-result">No posts yet</p>
      )}
    </>
  );
};
export default UserStartups;