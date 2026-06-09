"use client";

import { useSession, signOut } from "next-auth/react";
import { BadgePlus, MessageSquare, Trophy, Award, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NotificationBell from "@/components/notifications/NotificationBell";
import ChatController from "@/components/chat/ChatController";
import { useRealtimeNotifications } from "@/hooks/notifications/useRealtimeNotifications";
import { usePathname } from "next/navigation";
import LoginPanel from "@/components/auth/LoginPanel";
import { signOutFirebase } from "@/lib/firebase-auth-client";

const Navbar = () => {
  const session = useSession();
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const pathname = usePathname();
  const hideNotifications = pathname?.startsWith("/user/");

  useRealtimeNotifications();

  const handleSignOut = async () => {
    await signOutFirebase();
    await signOut({ callbackUrl: "/" });
  };

  return (
    <header className="fixed top-0 left-0 right-0 px-5 py-3 bg-white shadow-sm font-work-sans z-50">
      <nav className="flex justify-between items-center">
        <Link href="/">
          <Image
            src="/logo.png"
            alt="logo"
            width={144}
            height={30}
            className="h-[30px] w-auto"
            style={{ width: "auto", height: "auto" }}
          />
        </Link>
        <div className="flex items-center gap-5 text-black">
          {session.data && session.data.user ? (
            <>
              <div className="sm:hidden">
                {hideNotifications ? (
                  <Link
                    href={`/user/${session.data.user.id}/menu`}
                    aria-label="Menu"
                    className="relative flex items-center gap-2 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
                  >
                    <Menu className="size-6" />
                  </Link>
                ) : (
                  <NotificationBell />
                )}
              </div>
              <div className="hidden sm:flex items-center gap-5">
                <Link
                  href="/startup/create"
                  className="p-2 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-colors flex items-center gap-2"
                >
                  <BadgePlus className="size-5" />
                  <span className="max-sm:hidden">Create</span>
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setIsMessagesOpen(true)}
                    className="relative flex items-center gap-2 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
                  >
                    <MessageSquare className="size-5" />
                    <span className="max-sm:hidden">Messages</span>
                  </button>
                </div>

                <Link
                  href={`/badges?user=${session.data.user.id}`}
                  className="p-2 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-colors flex items-center gap-2"
                >
                  <Trophy className="size-5" />
                  <span className="max-sm:hidden">Badges</span>
                </Link>

                <Link
                  href="/leaderboard"
                  className="p-2 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-colors flex items-center gap-2"
                >
                  <Award className="size-5" />
                  <span className="max-sm:hidden">Leaderboard</span>
                </Link>

                {!hideNotifications && <NotificationBell />}

                <Link href={`/user/${session.data.user.id}`}>
                  <Avatar className="size-10">
                    <AvatarImage
                      src={session.data.user.image || ""}
                      alt={session.data.user.name || ""}
                    />
                    <AvatarFallback>
                      {session.data.user.name?.slice(0, 1) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Link>

                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-colors text-sm"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => setIsLoginOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-colors"
            >
              Login
            </button>
          )}
        </div>
      </nav>

      {isLoginOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <button
              onClick={() => setIsLoginOpen(false)}
              className="absolute right-4 top-4 text-gray-500 hover:text-black"
              aria-label="Close"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4 pr-8">Sign in</h2>
            <LoginPanel onSuccess={() => setIsLoginOpen(false)} />
          </div>
        </div>
      )}

      {session.data?.user && (
        <ChatController
          isOpen={isMessagesOpen}
          onClose={() => setIsMessagesOpen(false)}
          currentUserId={session.data.user.id}
        />
      )}
    </header>
  );
};

export default Navbar;
