"use client";

import { useEffect, useState } from "react";
import { client } from "@/sanity/lib/client";
import { STARTUP_BY_ID_QUERY } from "@/sanity/lib/queries";
import StartupCard from "./StartupCard";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";

interface RecommendedStartupCardProps {
  id: string;
  similarity?: number;
  onStartupSelect?: (startup: any) => void;
}

export default function RecommendedStartupCard({ id, similarity, onStartupSelect }: RecommendedStartupCardProps) {
  const [startup, setStartup] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const userId = session?.user?.id;

  useEffect(() => {
    async function fetchStartup() {
      setLoading(true);
      const data = await client.fetch(STARTUP_BY_ID_QUERY, { id });
      setStartup(data);
      setLoading(false);
    }
    fetchStartup();
  }, [id]);

  if (loading || !startup) {
    return <div className="relative h-full"><div className="p-6">Loading...</div></div>;
  }
  return (
    <StartupCard 
      post={startup} 
      isLoggedIn={!!userId} 
      userId={userId}
    />
  );
}
