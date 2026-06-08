import React, { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import { useSession } from 'next-auth/react';
import { Message, Suggested } from '@/types/chat';
import SuggestedUsers from '@/components/profile/SuggestedUsers';
import NewMessageScreen from './NewMessageScreen';
import { ChatBanMessage } from './BanMessage';

// --- Icon Components (placeholders) ---
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const UserPlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="m22 21-2-2"></path><path d="M16 16h6"></path></svg>;

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;

const Avatar: React.FC<{ initial?: string; src?: string; isInvite?: boolean }> = ({ initial, src, isInvite }) => {
    if (src) {
        const isPinterest = src.includes('E60023');
        return <img src={src} alt="avatar" className={`w-[50px] h-[50px] rounded-full mr-3 object-cover ${isPinterest ? 'bg-[#E60023]' : ''}`} />;
    }
    if (isInvite) {
        return <div className="w-[50px] h-[50px] rounded-full mr-3 flex items-center justify-center bg-gray-100 text-gray-600"><UserPlusIcon /></div>
    }
    return <div className="w-[50px] h-[50px] rounded-full mr-3 flex items-center justify-center bg-gray-200 text-gray-900 font-medium text-xl">{initial}</div>;
};

const MessageItem: React.FC<{ item: Message; onSelect: (id: string) => void; idx: number }> = ({ item, onSelect, idx }) => (
    <div
      className={`flex items-center px-4 py-2 cursor-pointer transition-colors rounded-lg ${
        item.unreadCount && item.unreadCount > 0 
          ? 'bg-blue-50 border-l-4 border-l-blue-500 unread-glow' 
          : idx === 2 ? 'bg-gray-100' : ''
      } hover:bg-gray-100`}
      onClick={() => onSelect(item.id)}
    >
        <Avatar src={item.avatarUrl} initial={item.avatarInitial} />
        <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-2">
                <span className={`font-bold text-base truncate ${
                    item.unreadCount && item.unreadCount > 0 ? 'text-blue-900' : 'text-gray-900'
                }`}>
                    {item.name}
                </span>
                {item.unreadCount && item.unreadCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                        {item.unreadCount > 99 ? '99+' : item.unreadCount}
                    </span>
                )}
            </div>
            <span className={`text-sm truncate max-w-xs ${
                item.unreadCount && item.unreadCount > 0 ? 'text-blue-700 font-medium' : 'text-gray-600'
            }`}>
                {item.message}
            </span>
        </div>
        <div className="flex flex-col items-end gap-1">
            <span className={`text-xs ml-2 whitespace-nowrap ${
                item.unreadCount && item.unreadCount > 0 ? 'text-blue-600 font-medium' : 'text-gray-400'
            }`}>
                {item.time}
            </span>
            {item.hasCloseButton && <button className="ml-2 p-0 bg-none border-none cursor-pointer flex items-center"><CloseIcon /></button>}
        </div>
    </div>
);

interface MessagesScreenProps {
  onSelectChat: (id: string) => void;
  onClose?: () => void;
}

const MessagesScreen: React.FC<MessagesScreenProps> = ({ onSelectChat, onClose }) => {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [showNewMessage, setShowNewMessage] = useState(false);
    const [isBanned, setIsBanned] = useState(false);
    const [banDescription, setBanDescription] = useState("");
    const [isStreamChatLoaded, setIsStreamChatLoaded] = useState(false);
    const userId = session?.user?.id;

    useEffect(() => {
        if (!userId) return;
        let chatClient: StreamChat;
        let disconnect: (() => void) | undefined;

        async function fetchChannels() {
            const res = await fetch("/api/chat/token", {
                method: "POST",
                body: JSON.stringify({ userId }),
                headers: { "Content-Type": "application/json" },
            });
            
            if (!res.ok) {
                const error = await res.json();
                if (res.status === 403) {
                    console.error('Account suspended:', error.error);
                    setIsBanned(true);
                    setBanDescription(error.error || 'Account is suspended. You cannot send messages.');
                    return;
                }
                throw new Error(error.error || 'Failed to get chat token');
            }
            
            const { token } = await res.json();

            chatClient = StreamChat.getInstance(apiKey);
            await chatClient.connectUser(
                {
                    id: userId,
                    name: session?.user?.name,
                    image: (session?.user as any)?.image || undefined,
                },
                token
            );

            const filters = { members: { $in: [userId] }, type: "messaging" };
            const sort = [{ last_message_at: -1 }];
            const userChannels = await chatClient.queryChannels(filters, sort, { watch: true, state: true, limit: 30 });

            // Mark Stream Chat as loaded
            setIsStreamChatLoaded(true);

            // Set up real-time listeners for unread count updates
            const updateUnreadCounts = () => {
                const mappedMessages = userChannels.map((ch) => {
                    const other = Object.values(ch.state.members).find((m: any) => m.user.id !== userId)?.user;
                    const lastMessage = ch.state.messages.length > 0 ? ch.state.messages[ch.state.messages.length - 1] : null;
                    const unreadCount = ch.countUnread() || undefined;
                    
                    return {
                        id: ch.id,
                        name: other?.name || other?.id || "Unknown",
                        message: lastMessage
                            ? lastMessage.text
                            : "No messages yet.",
                        time: lastMessage
                            ? new Date(lastMessage.created_at).toLocaleDateString()
                            : "",
                        avatarUrl: other?.image,
                        unreadCount: unreadCount,
                        lastMessageAt: lastMessage?.created_at
                    };
                });
                

                setMessages(mappedMessages);
            };

            // Listen for new messages to update unread counts
            userChannels.forEach(ch => {
              ch.on('message.new', () => {
                if (chatClient && chatClient.userID) {
                  updateUnreadCounts();
                }
              });
              ch.on('message.read', () => {
                if (chatClient && chatClient.userID) {
                  updateUnreadCounts();
                }
              });
            });

            updateUnreadCounts();

            disconnect = () => {
              try {
                // Remove event listeners first
                userChannels.forEach(ch => {
                  try {
                    ch.off('message.new');
                    ch.off('message.read');
                  } catch (error) {
                    // Error removing event listeners
                  }
                });
                
                // Then disconnect the client
                if (chatClient && typeof chatClient.disconnectUser === 'function') {
                  chatClient.disconnectUser();
                }
              } catch (error) {
                // Error during cleanup
              }
            };
        }

        fetchChannels();
        return () => { 
          // Cleanup in correct order: unsubscribe from events first, then disconnect
          if (disconnect && typeof disconnect === 'function') {
            try {
              disconnect();
            } catch (error) {
              // Error during cleanup
            }
          }
        };
    }, [userId]);

    const handleSuggestedUserSelect = (user: any) => {
        // Handle suggested user selection - could start a new chat
        // You can implement logic to start a new chat with this user
    };

    const handleNewMessageClick = () => {
        setShowNewMessage(true);
    };

    const handleNewMessageBack = () => {
        setShowNewMessage(false);
    };

    const handleContactSelect = (contact: any) => {
        // Here you would implement the logic to start a new chat with the selected contact
        // For now, just go back to the messages screen
        setShowNewMessage(false);
    };

    const handleStartChat = (chatId: string, contact: any) => {
        // Start the new chat by calling onSelectChat with the new chat ID
        onSelectChat(chatId);
        setShowNewMessage(false);
    };

    // Show NewMessageScreen if active
    if (showNewMessage) {
        return (
            <NewMessageScreen 
                onGoBack={handleNewMessageBack}
                onSelectContact={handleContactSelect}
                onStartChat={handleStartChat}
            />
        );
    }

    return (
        <div className="flex flex-col h-full w-full">
            {onClose && (
                <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
                    <button className="bg-none border-none cursor-pointer p-1 flex items-center justify-center mr-2" onClick={onClose}><CloseIcon /></button>
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-bold m-0">Messages</h1>
                        {session?.data?.user && isStreamChatLoaded && (() => {
                            const totalUnread = messages.reduce((sum, msg) => sum + (msg.unreadCount || 0), 0);
                            console.log('MessagesScreen header badge calculation:', totalUnread > 0 ? totalUnread : 'none', 'from messages:', messages.map(m => ({ name: m.name, unreadCount: m.unreadCount !== undefined ? m.unreadCount : 'undefined' })));
                            // Only show badge if totalUnread is a positive number
                            return totalUnread > 0 ? (
                                <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                                    {totalUnread > 99 ? '99+' : totalUnread}
                                </span>
                            ) : null;
                        })()}
                    </div>
                    <div className="w-8"></div>
                </div>
            )}

            <div className="flex-1 py-2 overflow-y-auto">
                {isBanned && (
                    <ChatBanMessage 
                        description={banDescription}
                        isPermanent={banDescription.includes('permanent')}
                    />
                )}
                
                {isBanned ? (
                    <div className="flex items-center px-4 py-2 gap-4 opacity-50 cursor-not-allowed">
                        <button className="bg-gray-400 border-none rounded-full w-14 h-14 flex items-center justify-center cursor-not-allowed" disabled><EditIcon /></button>
                        <span className="text-lg font-bold text-gray-500">New message (disabled)</span>
                    </div>
                ) : (
                    <div className="flex items-center px-4 py-2 gap-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={handleNewMessageClick}>
                        <button className="bg-[#e60023] border-none rounded-full w-14 h-14 flex items-center justify-center cursor-pointer"><EditIcon /></button>
                        <span className="text-lg font-bold">New message</span>
                    </div>
                )}

                <div className="py-2">
                    <h2 className="text-base font-normal text-gray-600 px-4 mb-1">Messages</h2>
                    {messages.map((msg, idx) => <MessageItem key={msg.id} item={msg} onSelect={onSelectChat} idx={idx} />)}
                </div>

                <div className="py-2">
                    <h2 className="text-base font-normal text-gray-600 px-4 mb-1">Suggested</h2>
                    <SuggestedUsers onSelectUser={handleSuggestedUserSelect} onStartChat={handleStartChat} maxResults={5} />
                </div>
            </div>
        </div>
    );
};

export default MessagesScreen; 