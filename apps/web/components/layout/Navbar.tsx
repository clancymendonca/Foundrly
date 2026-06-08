"use client";

import { useSession, signIn, signOut } from 'next-auth/react'
import { BadgePlus, LogOut, MessageSquare, Trophy, Award, Brain, Menu } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import NotificationBell from '@/components/notifications/NotificationBell'
import ChatController from '@/components/chat/ChatController'
import { useRealtimeNotifications } from '@/hooks/notifications/useRealtimeNotifications'
import { usePathname } from 'next/navigation'

const Navbar = () => {
    const session = useSession();
    const [isMessagesOpen, setIsMessagesOpen] = useState(false);
    const pathname = usePathname();
    const hideNotifications = pathname?.startsWith('/user/');
    
    // Initialize real-time notifications globally
    useRealtimeNotifications();
    
    // Messages loaded

  return (
    <header className="fixed top-0 left-0 right-0 px-5 py-3 bg-white shadow-sm font-work-sans z-50" >
        <nav className="flex justify-between items-center">
            <Link href="/">
                <Image src="/logo.png" alt="logo" width={144} height={30} className="h-[30px] w-auto" style={{ width: 'auto', height: 'auto' }} />
            </Link> 
            <div className="flex items-center gap-5 text-black">
                { session.data && session.data.user ? (
                    <>
                        {/* Mobile: show only bell; Desktop: show full action set including bell */}
                        <div className="sm:hidden">
                            {hideNotifications ? (
                                <Link
                                    href={`/user/${session.data.user.id}/menu`}
                                    aria-label="Menu"
                                    className="relative flex items-center gap-2 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
                                >
                                    <Menu className='size-6' />
                                </Link>
                            ) : (
                                <NotificationBell />
                            )}
                        </div>
                        <div className="hidden sm:flex items-center gap-5">
                            <Link href="/startup/create" className="p-2 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-colors flex items-center gap-2">
                                <BadgePlus className='size-5' />
                                <span className="max-sm:hidden">Create</span>
                            </Link>

                            <div className="relative">
                                <button 
                                    onClick={() => setIsMessagesOpen(true)}
                                    className="relative flex items-center gap-2 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
                                >
                                    <MessageSquare className='size-5' />
                                    <span className="max-sm:hidden">Messages</span>
                                </button>
                            </div>

                            <Link href={`/badges?user=${session.data.user.id}`} className="p-2 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-colors flex items-center gap-2">
                                <Trophy className='size-5' />
                                <span className="max-sm:hidden">Badges</span>
                            </Link>
                                    
                            <Link href="/leaderboard" className="p-2 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-colors flex items-center gap-2">
                                <Award className='size-5' />
                                <span className="max-sm:hidden">Leaderboard</span>
                            </Link>

                            {!hideNotifications && <NotificationBell />}

                            <Link href={`/user/${session.data.user.id}`}>
                                <Avatar className='size-10' >
                                    <AvatarImage src={session.data.user.image || ''} alt={session.data.user.name || ''}/>
                                    <AvatarFallback>{session.data.user.name?.slice(0, 1) || 'U'}</AvatarFallback>
                                </Avatar>
                            </Link>
                        </div>
                    </> 
                ) : (
                        <button onClick={() => signIn('github')} className="p-2 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-colors">
                            Login
                        </button>
                )}
            </div>
        </nav>
        {session.data?.user && (
            <ChatController
                isOpen={isMessagesOpen}
                onClose={() => setIsMessagesOpen(false)}
                currentUserId={session.data.user.id}
            />
        )}
    </header>
  )
}
  
export default Navbar