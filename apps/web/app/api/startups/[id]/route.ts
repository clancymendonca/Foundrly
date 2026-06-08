import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { updateStartup, deleteStartup } from "@/lib/startup-service";
import { sanityFetch } from "@/sanity/lib/live";
import { STARTUP_BY_ID_QUERY } from "@/sanity/lib/queries";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { data } = await sanityFetch({
      query: STARTUP_BY_ID_QUERY,
      params: { id },
    });

    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/startups/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch startup" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const result = await updateStartup(session, id, body);

    if (result.status === "ERROR") {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("PATCH /api/startups/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update startup" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await deleteStartup(session, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/startups/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete startup" },
      { status: 500 },
    );
  }
}
