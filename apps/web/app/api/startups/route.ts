import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { createStartup } from "@/lib/startup-service";
import { awardBadgesForAction } from "@/lib/badges/award-badges-for-action";
import { sanityFetch } from "@/sanity/lib/live";
import { STARTUPS_SORTED_QUERY } from "@/sanity/lib/queries";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "recent";
    const search = searchParams.get("search") || null;

    const selectedQuery = STARTUPS_SORTED_QUERY(filter);
    const { data } = await sanityFetch({
      query: selectedQuery,
      params: { search },
    });

    return NextResponse.json({ startups: data, filter });
  } catch (error) {
    console.error("GET /api/startups error:", error);
    return NextResponse.json(
      { error: "Failed to fetch startups" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = await createStartup(session, body);

    if (result.status === "ERROR") {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    void awardBadgesForAction(session.user.id, "startups_created").catch(console.error);

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error("POST /api/startups error:", error);
    return NextResponse.json(
      { error: "Failed to create startup" },
      { status: 500 },
    );
  }
}
