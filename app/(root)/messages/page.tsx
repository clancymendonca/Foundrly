"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import MessagesScreen from "@/components/chat/MessagesScreen";
import ChatView from "@/components/chat/ChatView";

export default function MessagesPage() {
    const { data: session } = useSession();
    const currentUserId = session?.user?.id as string | undefined;
    const [currentView, setCurrentView] = useState<'list' | 'chat'>('list');
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

    useEffect(() => {
        // Ensure list view on initial mount
        setCurrentView('list');
        setSelectedChatId(null);
    }, []);

    const handleSelectChat = (id: string) => {
        setSelectedChatId(id);
        setCurrentView('chat');
    };

    const handleGoBack = () => {
        setCurrentView('list');
        setSelectedChatId(null);
    };

    return (
        <div className="min-h-screen bg-white sm:bg-gray-50">
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                {currentView === 'list' ? (
                    <MessagesScreen onSelectChat={handleSelectChat} />
                ) : (
                    currentUserId && (
                        <ChatView chatId={selectedChatId} onGoBack={handleGoBack} currentUserId={currentUserId} />
                    )
                )}
            </div>
        </div>
    );
}


