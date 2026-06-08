"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function MobilePageHeader({ title }: { title: string }) {
    const router = useRouter();
    return (
        <div className="lg:hidden flex items-center gap-3 py-2 border-b border-gray-200 mb-3">
            <button
                type="button"
                aria-label="Back"
                onClick={() => router.back()}
                className="p-2 rounded-lg hover:bg-gray-100"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <h1 className="text-lg font-semibold">{title}</h1>
        </div>
    );
}


