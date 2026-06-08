import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import {
  upsertAuthorFromFirebase,
  verifyFirebaseIdToken,
} from "./lib/firebase-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      id: "firebase",
      name: "Firebase",
      credentials: {
        idToken: { label: "ID Token", type: "text" },
      },
      async authorize(credentials) {
        const idToken = credentials?.idToken;
        if (!idToken || typeof idToken !== "string") {
          return null;
        }

        try {
          const decoded = await verifyFirebaseIdToken(idToken);
          const author = await upsertAuthorFromFirebase(decoded);

          if (!author?._id) {
            return null;
          }

          return {
            id: author._id,
            name: author.name ?? decoded.name ?? null,
            email: author.email ?? decoded.email ?? null,
            image: author.image ?? decoded.picture ?? null,
          };
        } catch (error) {
          console.error("Firebase credentials authorize error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
