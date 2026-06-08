import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

// --- SVG Icon Components ---
const BackArrowIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
    </svg>
);

const SearchIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#65676B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const ChevronDownIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9l6 6 6-6" />
    </svg>
);

// --- Type Definitions ---
type Contact = {
    _id: string;
    name: string;
    username: string;
    image?: string;
    bio?: string;
    type?: 'follower' | 'mutual' | 'other';
};

interface NewMessageScreenProps {
    onGoBack: () => void;
    onSelectContact: (contact: Contact) => void;
    onStartChat?: (chatId: string, contact: Contact) => void;
}

// --- Main Component ---
const NewMessageScreen: React.FC<NewMessageScreenProps> = ({ onGoBack, onSelectContact, onStartChat }) => {
    const { data: session } = useSession();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [creatingChat, setCreatingChat] = useState<string | null>(null);

    const fetchContacts = async () => {
        if (!session?.user?.id) return;

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                currentUserId: session.user.id,
                limit: '20'
            });

            const response = await fetch(`/api/users/suggested?${params}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch contacts');
            }

            const data = await response.json();
            setContacts(data.users || []);
        } catch (err) {
            console.error('Error fetching contacts:', err);
            setError('Failed to load contacts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, [session?.user?.id]);

    const filteredContacts = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleContactSelect = async (contact: Contact) => {
        if (!session?.user?.id) return;

        setCreatingChat(contact._id);

        try {
            
            // First, create/upsert the user in Stream Chat
            const upsertResponse = await fetch('/api/chat/upsert-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: contact._id,
                    name: contact.name,
                    image: contact.image
                }),
            });

            if (!upsertResponse.ok) {
                const upsertError = await upsertResponse.json();
                console.error('Upsert user error:', upsertError);
                
                if (upsertResponse.status === 403) {
                    throw new Error(upsertError.error || 'Account is suspended. You cannot send messages.');
                }
                
                throw new Error(`Failed to create user in Stream Chat: ${upsertError.error || upsertError}`);
            }



            // Create a new chat channel
            const chatResponse = await fetch('/api/chat/create-channel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: session.user.id,
                    memberIds: [session.user.id, contact._id],
                    channelData: {
                        name: `Chat with ${contact.name}`,
                        image: contact.image
                    }
                }),
            });

            if (!chatResponse.ok) {
                const chatError = await chatResponse.json();
                console.error('Create channel error:', chatError);
                
                if (chatResponse.status === 403) {
                    throw new Error(chatError.error || 'Account is suspended. You cannot send messages.');
                }
                
                throw new Error(`Failed to create chat channel: ${chatError.details || chatError.error || 'Unknown error'}`);
            }

            const { channelId } = await chatResponse.json();

            // Call the onStartChat callback if provided
            if (onStartChat) {
                onStartChat(channelId, contact);
            } else {
                // Fallback: just call onSelectContact
                onSelectContact(contact);
            }

        } catch (err) {
            console.error('Error creating chat:', err);
            setError(`Failed to start chat: ${err.message}`);
        } finally {
            setCreatingChat(null);
        }
    };

    const getUserTypeBadge = (type?: string) => {
        switch (type) {
            case 'follower':
                return <span className="text-xs text-blue-600 font-medium">Follows you</span>;
            case 'mutual':
                return <span className="text-xs text-green-600 font-medium">Mutual</span>;
            default:
                return null;
        }
    };

    if (!session?.user?.id) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                    Please log in to start a new message
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col bg-white rounded-2xl">
            {/* Header */}
            <header className="flex items-center px-4 py-3 border-b border-gray-200">
                <button 
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    onClick={onGoBack}
                >
                    <BackArrowIcon />
                </button>
                <h1 className="flex-1 text-center text-lg font-bold">New message</h1>
            </header>

            {/* Search Bar */}
            <div className="px-4 py-3">
                <div className="flex items-center bg-gray-100 rounded-2xl px-3 py-2">
                    <div className="mr-2">
                        <SearchIcon />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name or email"
                        className="flex-1 bg-transparent border-none outline-none text-base"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto px-4">
                <h2 className="text-base font-bold mb-3">Suggested</h2>
                
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : error ? (
                    <div className="text-center text-red-500 py-4">{error}</div>
                ) : filteredContacts.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        {searchTerm ? 'No contacts found' : 'No suggested contacts available'}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredContacts.map((contact) => (
                            <ContactItem 
                                key={contact._id} 
                                contact={contact} 
                                onSelect={handleContactSelect}
                                typeBadge={getUserTypeBadge(contact.type)}
                                isLoading={creatingChat === contact._id}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Sub-Component for each contact item ---
const ContactItem = ({ 
    contact, 
    onSelect, 
    typeBadge,
    isLoading
}: { 
    contact: Contact; 
    onSelect: (contact: Contact) => void;
    typeBadge: React.ReactNode;
    isLoading?: boolean;
}) => {
    return (
        <div 
            className={`flex items-center py-3 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors ${isLoading ? 'opacity-50' : ''}`}
            onClick={() => !isLoading && onSelect(contact)}
        >
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-3">
                {contact.image ? (
                    <Image
                        src={contact.image}
                        alt={contact.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className="text-lg font-bold text-gray-600">
                        {contact.name?.[0] || contact.username?.[0] || '?'}
                    </span>
                )}
            </div>
            
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-base text-gray-900 truncate">
                        {contact.name}
                    </span>
                    {typeBadge}
                </div>
                <span className="text-sm text-gray-500 truncate">
                    @{contact.username}
                </span>
                {contact.bio && (
                    <div className="text-xs text-gray-400 truncate mt-1">
                        {contact.bio}
                    </div>
                )}
            </div>
            
            <div className="text-gray-400">
                {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                ) : (
                    <ChevronDownIcon />
                )}
            </div>
        </div>
    );
};

export default NewMessageScreen; 