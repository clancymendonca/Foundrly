import { auth } from "@/auth";
import { client } from "@/sanity/lib/client";
import { STARTUP_BY_ID_QUERY } from "@/sanity/lib/queries";
import { notFound, redirect } from "next/navigation";
import StartupEditForm from "@/components/startup/StartupEditForm";

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const id = (await params).id;
  const session = await auth();

  if (!session) redirect("/");

  const startup = await client.fetch(STARTUP_BY_ID_QUERY, { id });
  
  if (!startup) return notFound();

  // Check if the current user is the author of the startup
  if (startup.author?._id !== session.user.id) {
    redirect("/");
  }

  return (
    <>
      <section className="blue_container !min-h-[230px]">
        <h1 className="heading">Edit Your Startup</h1>
      </section>

      <StartupEditForm startup={startup} />
    </>
  );
};

export default Page; 