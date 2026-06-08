import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import { client } from "./sanity/lib/client";
import { AUTHOR_BY_GITHUB_ID_QUERY } from "./sanity/lib/queries";
import { writeClient } from "./sanity/lib/write-client";
 

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  callbacks: {
    async signIn({
      user: { name, email, image },
      profile: { id, login, bio },
    }) {
      const existingUser = await client
        .withConfig({ useCdn: false })
        .fetch(AUTHOR_BY_GITHUB_ID_QUERY, {
          id,
        });

      if (!existingUser) {
        await writeClient.create({
          _type: "author",
          id,
          name,
          username: login,
          email,
          image,
          bio: bio || "",
          followers: [],
          following: [],
        });
      }

      // Upsert user in Stream Chat
      try {
        await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/chat/upsert-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, name, image }),
        });
      } catch (e) {
        // Log but don't block sign in
        console.error("Stream Chat upsert-user error", e);
      }

      return true;
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const user = await client
          .withConfig({ useCdn: false })
          .fetch(AUTHOR_BY_GITHUB_ID_QUERY, {
            id: profile?.id,
          });

        token.id = user?._id;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});

// Export authOptions for API routes that need it
export const authOptions = {
  providers: [GitHub],
  callbacks: {
    async signIn({
      user: { name, email, image },
      profile: { id, login, bio },
    }) {
      const existingUser = await client
        .withConfig({ useCdn: false })
        .fetch(AUTHOR_BY_GITHUB_ID_QUERY, {
          id,
        });

      if (!existingUser) {
        await writeClient.create({
          _type: "author",
          id,
          name,
          username: login,
          email,
          image,
          bio: bio || "",
          followers: [],
          following: [],
        });
      }

      // Upsert user in Stream Chat
      try {
        await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/chat/upsert-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, name, image }),
        });
      } catch (e) {
        // Log but don't block sign in
        console.error("Stream Chat upsert-user error", e);
      }

      return true;
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const user = await client
          .withConfig({ useCdn: false })
          .fetch(AUTHOR_BY_GITHUB_ID_QUERY, {
            id: profile?.id,
          });

        token.id = user?._id;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};