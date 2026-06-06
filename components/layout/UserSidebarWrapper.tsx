'use client';

import React from 'react';
import UserSidebar from './UserSidebar';

interface UserSidebarWrapperProps {
  userId: string;
  isOwnProfile: boolean;
}

export default function UserSidebarWrapper({ userId, isOwnProfile }: UserSidebarWrapperProps) {
  if (!isOwnProfile) {
    return null;
  }

  return <UserSidebar userId={userId} isOwnProfile={isOwnProfile} />;
}

