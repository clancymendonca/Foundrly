"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import UserSidebar from "@/components/layout/UserSidebar";

export default function UserMenuPage() {
    const { data: session } = useSession();
    const params = useParams();
    const router = useRouter();
    const id = (params?.id as string) || '';
    const isOwnProfile = !!session?.user?.id && session.user.id === id;

    if (!session?.user?.id) {
        return (
            <div className="h-screen bg-white text-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
                    <p className="text-gray-600">You need to be signed in to view this menu.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex items-center gap-3 py-2 border-b border-gray-200 mb-3">
                    <button
                        type="button"
                        aria-label="Back"
                        onClick={() => router.back()}
                        className="p-2 rounded-lg hover:bg-gray-100"
                    >
                        {/* Back chevron */}
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                    </button>
                    <h1 className="text-lg font-semibold">Menu</h1>
                </div>
                <UserSidebar userId={id} isOwnProfile={isOwnProfile} mode="page" />
            </div>
        </div>
    );
}


