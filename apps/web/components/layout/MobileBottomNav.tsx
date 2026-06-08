"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { BadgePlus, MessageSquare, Trophy, Award } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const MobileBottomNav = () => {
    const { data: session } = useSession();

    if (!session?.user) return null;

    return (
        <>
            <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
                <ul className="flex justify-between items-center px-4 py-2 text-xs text-gray-700">
                    <li>
                        <Link href="/startup/create" className="flex flex-col items-center p-2 rounded-md hover:text-blue-600 hover:bg-gray-100">
                            <BadgePlus className="size-6" />
                            <span className="mt-1">Create</span>
                        </Link>
                    </li>
                    <li>
                        <Link href="/messages" className="flex flex-col items-center p-2 rounded-md hover:text-blue-600 hover:bg-gray-100">
                            <MessageSquare className="size-6" />
                            <span className="mt-1">Messages</span>
                        </Link>
                    </li>
                    <li>
                        <Link href={`/badges?user=${session.user.id}`} className="flex flex-col items-center p-2 rounded-md hover:text-blue-600 hover:bg-gray-100">
                            <Trophy className="size-6" />
                            <span className="mt-1">Badges</span>
                        </Link>
                    </li>
                    <li>
                        <Link href="/leaderboard" className="flex flex-col items-center p-2 rounded-md hover:text-blue-600 hover:bg-gray-100">
                            <Award className="size-6" />
                            <span className="mt-1">Leaders</span>
                        </Link>
                    </li>
                    <li>
                        <Link href={`/user/${session.user.id}`} className="flex flex-col items-center p-2 rounded-md hover:text-blue-600 hover:bg-gray-100">
                            <Avatar className="size-6">
                                <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                                <AvatarFallback>{session.user.name?.slice(0, 1) || 'U'}</AvatarFallback>
                            </Avatar>
                            <span className="mt-1">You</span>
                        </Link>
                    </li>
                </ul>
            </nav>
        </>
    );
};

export default MobileBottomNav;



