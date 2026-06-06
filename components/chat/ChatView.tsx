import React, { useEffect, useRef, useState } from "react";
import { StreamChat } from "stream-chat";
import { useSession } from "next-auth/react";
import { Bell, BellOff } from "lucide-react";
import { ChatBanMessage } from "./BanMessage";
import { useStreamChatPushNotifications } from "@/hooks/notifications/useStreamChatPushNotifications";

const BackArrowIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
);
const AddIcon = () => (
  <svg height="24" width="24" viewBox="0 0 24 24" fill="white"><path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z" /></svg>
);
const SendIcon = () => (
  <svg height="24" width="24" viewBox="0 0 24 24" fill="white"><path d="M3 20V4L22 12L3 20ZM5 17L16.85 12L5 7V10.5L11 12L5 13.5V17Z" /></svg>
);
const ReplyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 10 4 15 9 20" /><path d="M20 4v7a4 4 0 0 1-4 4H4" /></svg>
);
const AddReactionIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const EMOJI_REACTIONS = ['❤️', '😂', '😍', '😮', '👍', '👎'];

// Map emojis to valid Stream Chat reaction types
const EMOJI_TO_REACTION_TYPE: { [emoji: string]: string } = {
  '❤️': 'heart',
  '😂': 'laugh',
  '😍': 'love',
  '😮': 'wow',
  '👍': 'thumbsup',
  '👎': 'thumbsdown'
};

const REACTION_TYPE_TO_EMOJI: { [type: string]: string } = {
  'heart': '❤️',
  'laugh': '😂',
  'love': '😍',
  'wow': '😮',
  'thumbsup': '👍',
  'thumbsdown': '👎'
};

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;

interface ChatViewProps {
  chatId: string | null;
  onGoBack: () => void;
  currentUserId: string;
}

const ChatView: React.FC<ChatViewProps> = ({ chatId, onGoBack, currentUserId }) => {
  const { data: session } = useSession();
  const userId = currentUserId;
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [channel, setChannel] = useState<any>(null);
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);
  const [isBanned, setIsBanned] = useState(false);
  const [banDescription, setBanDescription] = useState("");
  const [isCheckingModeration, setIsCheckingModeration] = useState(false);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  
  // Initialize Stream Chat push notifications
  const {
    isSupported: pushNotificationsSupported,
    isEnabled: pushNotificationsEnabled,
    registerForPushNotifications,
    unregisterFromPushNotifications
  } = useStreamChatPushNotifications(chatClient);

  useEffect(() => {
    if (!userId || !chatId) return;
    let channelInstance: any;
    let unsub: any;

    async function init() {
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
      const newChatClient = StreamChat.getInstance(apiKey);
      await newChatClient.connectUser(
        {
          id: userId,
          // include name and image to ensure UI shows display name instead of ID
          name: session?.user?.name,
          image: (session?.user as any)?.image || undefined,
        },
        token
      );
      setChatClient(newChatClient);

      channelInstance = newChatClient.channel("messaging", chatId);
      await channelInstance.watch();
      setChannel(channelInstance);
      setMessages(channelInstance.state.messages);
      
      // Mark messages as read when opening the chat
      await channelInstance.markRead();

      unsub = channelInstance.on("message.new", () => {
        // Check if client is still connected before calling methods
        if (newChatClient && newChatClient.userID) {
          // Just update the state with the current messages from the channel
          setMessages([...channelInstance.state.messages]);
          // Mark new messages as read
          try {
            channelInstance.markRead();
          } catch (error) {
            // Error marking messages as read
          }
        }
      });
      channelInstance.on("message.updated", () => {
        if (newChatClient && newChatClient.userID) {
          setMessages([...channelInstance.state.messages]);
        }
      });
      channelInstance.on("reaction.new", () => {
        if (newChatClient && newChatClient.userID) {
          setMessages([...channelInstance.state.messages]);
        }
      });
      channelInstance.on("reaction.deleted", () => {
        if (newChatClient && newChatClient.userID) {
          setMessages([...channelInstance.state.messages]);
        }
      });
    }
    init();
    return () => {
      // Cleanup in correct order: unsubscribe first, then stop watching, then disconnect
      if (unsub && typeof unsub.unsubscribe === 'function') {
        try {
          unsub.unsubscribe();
        } catch (error) {
          // Error unsubscribing from channel events
        }
      }
      
      if (channelInstance && 
          typeof channelInstance.stopWatching === 'function' && 
          chatClient && 
          !chatClient.disconnected &&
          channelInstance.state &&
          !channelInstance.state.disconnected) {
        try {
          channelInstance.stopWatching();
        } catch (error) {
          // Error stopping channel watch
        }
      }
      
      if (chatClient && 
          typeof chatClient.disconnectUser === 'function' && 
          !chatClient.disconnected) {
        try {
          chatClient.disconnectUser();
        } catch (error) {
          // Error disconnecting user
        }
      }
      
      // Clear the chat client state
      setChatClient(null);
    };
  }, [userId, chatId]);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !channel || isCheckingModeration) return;

    setIsCheckingModeration(true);
    try {
      const response = await fetch('/api/moderation/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input }),
      });

      if (!response.ok) {
        alert('Unable to verify message content right now. Please try again in a moment.');
        return;
      }

      const data = await response.json();
      const moderationResult = data.result;

      if (moderationResult?.isFlagged) {
        alert(`⚠️ Warning: ${moderationResult.reason}\n\nYour message contains content that may violate our community guidelines. Please review and edit your message.`);
        return;
      }
    } catch (error) {
      console.error('Moderation check failed:', error);
      alert('Unable to verify message content right now. Please try again in a moment.');
      return;
    } finally {
      setIsCheckingModeration(false);
    }

    await channel.sendMessage({ text: input });
    setInput("");
  };

  const handleReaction = async (msg: any, emoji: string) => {
    if (!channel) return;
    const reactionType = EMOJI_TO_REACTION_TYPE[emoji];
    if (!reactionType) return;
    
    const userReaction = (msg.own_reactions || []).find((r: any) => r.user_id === userId && r.type === reactionType);
    if (userReaction) {
      await channel.deleteReaction(msg.id, reactionType);
    } else {
      await channel.sendReaction(msg.id, { type: reactionType });
    }
  };

  const otherUser = channel?.state?.members
    ? Object.values(channel.state.members).find((m: any) => m.user.id !== userId)?.user
    : null;

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <button className="p-1 rounded-full hover:bg-gray-100" onClick={onGoBack}><BackArrowIcon /></button>
        {otherUser?.image ? (
          <img src={otherUser.image} alt={otherUser.name} className="w-10 h-10 rounded-full object-cover mx-2" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-base font-bold text-gray-600 mx-2">{otherUser?.name?.[0] || "?"}</div>
        )}
        <span className="font-semibold flex-1">{otherUser?.name || "Chat"}</span>
        <div className="flex items-center gap-2">
          {/* Push Notification Toggle */}
          {(() => {
            const isReady = pushNotificationsSupported && 
                           chatClient && 
                           chatClient.userID && 
                           !chatClient.disconnected && 
                           chatClient.connectionID;
            

            
            return isReady ? (
              <button
                onClick={pushNotificationsEnabled ? unregisterFromPushNotifications : registerForPushNotifications}
                disabled={!chatClient?.userID || chatClient.disconnected || !chatClient.connectionID}
                className={`p-3 rounded-full transition-colors border-2 ${
                  pushNotificationsEnabled 
                    ? 'bg-green-500 text-white hover:bg-green-600 border-green-600' 
                    : 'bg-gray-500 text-white hover:bg-gray-600 border-gray-600'
                } ${!chatClient?.userID || chatClient.disconnected || !chatClient.connectionID ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={pushNotificationsEnabled ? 'Disable push notifications' : 'Enable push notifications'}
              >
                {pushNotificationsEnabled ? (
                  <Bell className="w-5 h-5" />
                ) : (
                  <BellOff className="w-5 h-5" />
                )}
              </button>
            ) : null;
          })()}
        </div>
      </div>

      {/* Chat Body */}
      <main ref={chatBodyRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1 bg-white">
        {isBanned && (
          <ChatBanMessage 
            description={banDescription}
            isPermanent={banDescription.includes('permanent')}
          />
        )}
        {messages.map((msg: any, idx: number) => {
          const isOutgoing = msg?.user?.id === userId;
          const reactions = msg.latest_reactions || [];
          const reactionCounts: { [emoji: string]: number } = {};
          reactions.forEach((r: any) => {
            reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
          });
          const showProfilePic = !isOutgoing && (
            idx === messages.length - 1 ||
            messages[idx + 1]?.user?.id !== msg.user.id
          );
          
          return (
            <div key={msg.id ? `${msg.id}-${idx}` : idx} className="flex w-full items-end mb-3 px-2">
              {/* Incoming: [profile][bubble][actions][spacer] */}
              {!isOutgoing && (
                <>
                  {showProfilePic ? (
                    <img src={otherUser?.image} alt={otherUser?.name} className="w-10 h-10 rounded-full mr-2" />
                  ) : (
                    <div className="w-10 mr-2" />
                  )}
                  <div className="group flex flex-col items-start relative">
                    <div className="flex items-center relative">
                      <div 
                        className={`max-w-[280px] px-4 py-2 rounded-2xl text-base shadow break-words cursor-pointer relative bg-gray-100`}
                        onClick={() => setActiveReactionMessageId(null)}
                      >
                        {msg.text}
                        {/* Reactions on bubble */}
                        {(() => {
                          const reactions = msg.latest_reactions || [];
                          const reactionCounts: { [emoji: string]: number } = {};
                          reactions.forEach((r: any) => {
                            const emoji = REACTION_TYPE_TO_EMOJI[r.type];
                            if (emoji) {
                              reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1;
                            }
                          });
                          
                          // Get the most common reaction or the first one
                          const reactionEntries = Object.entries(reactionCounts);
                          if (reactionEntries.length > 0) {
                            // Sort by count (descending) and take the first one
                            const [mostCommonEmoji, count] = reactionEntries.sort((a, b) => b[1] - a[1])[0];
                            return (
                              <div className="absolute -bottom-2 -right-1">
                                <span className="text-xs select-none px-1 py-0.5 bg-white rounded-full flex items-center shadow-sm border">
                                  {mostCommonEmoji}
                                </span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div className="flex flex-row items-center justify-center ml-2 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1" onClick={() => setActiveReactionMessageId(activeReactionMessageId === msg.id ? null : msg.id)}><AddReactionIcon /></button>
                      </div>
                    </div>
                    {/* Emoji picker positioned relative to chat bubble */}
                    {activeReactionMessageId === msg.id && (
                      <>
                        <div className="absolute inset-0 bg-black bg-opacity-20 z-40" onClick={() => setActiveReactionMessageId(null)} />
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 flex gap-2 bg-white rounded-2xl shadow-lg px-3 py-2 z-50 items-center" onClick={(e) => e.stopPropagation()}>
                          {EMOJI_REACTIONS.map((emoji) => (
                            <button
                              key={emoji}
                              className="text-2xl hover:scale-125 transition-transform"
                              onClick={() => {
                                handleReaction(msg, emoji);
                                setActiveReactionMessageId(null);
                              }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex-1" />
                </>
              )}
              {/* Outgoing: [spacer][actions][bubble] */}
              {isOutgoing && (
                <>
                  <div className="flex-1" />
                  <div className="group flex flex-col items-end relative">
                    <div className="flex items-center relative">
                      <div className="flex flex-row items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1" onClick={() => setActiveReactionMessageId(activeReactionMessageId === msg.id ? null : msg.id)}><AddReactionIcon /></button>
                      </div>
                      <div 
                        className="max-w-[280px] px-4 py-2 bg-blue-100 rounded-2xl text-base shadow break-words cursor-pointer relative"
                        onClick={() => setActiveReactionMessageId(null)}
                      >
                        {msg.text}
                        {/* Reactions on bubble */}
                        {(() => {
                          const reactions = msg.latest_reactions || [];
                          const reactionCounts: { [emoji: string]: number } = {};
                          reactions.forEach((r: any) => {
                            const emoji = REACTION_TYPE_TO_EMOJI[r.type];
                            if (emoji) {
                              reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1;
                            }
                          });
                          
                          // Get the most common reaction or the first one
                          const reactionEntries = Object.entries(reactionCounts);
                          if (reactionEntries.length > 0) {
                            // Sort by count (descending) and take the first one
                            const [mostCommonEmoji, count] = reactionEntries.sort((a, b) => b[1] - a[1])[0];
                            return (
                              <div className="absolute -bottom-2 -right-1">
                                <span className="text-xs select-none px-1 py-0.5 bg-white rounded-full flex items-center shadow-sm border">
                                  {mostCommonEmoji}
                                </span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                    {/* Emoji picker positioned relative to chat bubble */}
                    {activeReactionMessageId === msg.id && (
                      <>
                        <div className="absolute inset-0 bg-black bg-opacity-20 z-40" onClick={() => setActiveReactionMessageId(null)} />
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-2 bg-white rounded-2xl shadow-lg px-3 py-2 z-50 items-center" onClick={(e) => e.stopPropagation()}>
                          {EMOJI_REACTIONS.map((emoji) => (
                            <button
                              key={emoji}
                              className="text-2xl hover:scale-125 transition-transform"
                              onClick={() => {
                                handleReaction(msg, emoji);
                                setActiveReactionMessageId(null);
                              }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </main>

      {/* Footer */}
      <form onSubmit={handleSend} className="flex items-center px-4 py-3 gap-2 border-t border-gray-200 bg-white flex-shrink-0">
        {isBanned ? (
          <div className="flex-1 text-center text-gray-500 text-sm">
            Message input disabled - Account suspended
          </div>
        ) : (
          <>
            <input
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-base border-none outline-none"
              placeholder="Type a message..."
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <button type="submit" className="bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center" disabled={!input.trim()}><SendIcon /></button>
          </>
        )}
      </form>


    </div>
  );
};

export default ChatView; 