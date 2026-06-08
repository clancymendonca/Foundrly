'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import ActivityContentGrid from './ActivityContentGrid';
import SortFilterModal from '@/components/search/SortFilterModal';
import AccountHistory from './AccountHistory';

interface FilterState {
  sortBy: 'newest' | 'oldest';
  startDate: {
    month: string;
    day: string;
    year: string;
  };
  endDate: {
    month: string;
    day: string;
    year: string;
  };
}

interface ActivityMainContentProps {
  activeSection: string;
}

// Tab options for interactions
const interactionTabs = [
  { value: 'likes', label: 'Likes' },
  { value: 'dislikes', label: 'Dislikes' },
  { value: 'comments', label: 'Comments' },
  { value: 'reviews', label: 'Reviews' },
];

const ActivityMainContent = ({ activeSection }: ActivityMainContentProps) => {
  const { data: session } = useSession();
  
  // Debug logging
  console.log('ActivityMainContent: Session data:', session);
  console.log('ActivityMainContent: User ID:', session?.user?.id);
  console.log('ActivityMainContent: Active section:', activeSection);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('likes');
  const [currentFilters, setCurrentFilters] = useState<FilterState>({
    sortBy: 'newest',
    startDate: {
      month: 'January',
      day: '1',
      year: '2025'
    },
    endDate: {
      month: 'December',
      day: '31',
      year: '2025'
    }
  });
  
  // Account History state
  const [isAccountHistoryModalOpen, setIsAccountHistoryModalOpen] = useState(false);
  const [selectedAccountHistoryTab, setSelectedAccountHistoryTab] = useState<string>('');
  const [accountHistoryFilters, setAccountHistoryFilters] = useState<FilterState>({
    sortBy: 'newest',
    startDate: {
      month: 'January',
      day: '1',
      year: '2025'
    },
    endDate: {
      month: 'December',
      day: '31',
      year: '2025'
    }
  });

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleApplyFilters = (filters: FilterState) => {
    setCurrentFilters(filters);
    console.log('Applied filters:', filters);
  };

  const handleTabChange = (tabValue: string) => {
    setSelectedTab(tabValue);
  };
  
  // Account History handlers
  const handleAccountHistoryOpenModal = () => setIsAccountHistoryModalOpen(true);
  const handleAccountHistoryCloseModal = () => setIsAccountHistoryModalOpen(false);
  
  const handleAccountHistoryApplyFilters = (filters: FilterState) => {
    setAccountHistoryFilters(filters);
    console.log('Applied Account History filters:', filters);
  };
  
  const handleAccountHistoryTabChange = (tabValue: string) => {
    setSelectedAccountHistoryTab(tabValue);
  };

  const getSortText = () => {
    return currentFilters.sortBy === 'newest' ? 'Newest to oldest' : 'Oldest to newest';
  };
  
  const getAccountHistorySortText = () => {
    return accountHistoryFilters.sortBy === 'newest' ? 'Newest to oldest' : 'Oldest to newest';
  };

  const getActivityType = () => {
    if (activeSection === 'interactions') {
      return selectedTab;
    }
    switch (activeSection) {
      case 'account-history':
        return 'account-history';
      case 'ad-activity':
        return 'ads';
      default:
        return 'likes';
    }
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'interactions':
        return 'Interactions';
      case 'account-history':
        return 'Account History';
      case 'ad-activity':
        return 'Ad Activity';
      default:
        return 'Interactions';
    }
  };

  const getSectionDescription = () => {
    switch (activeSection) {
      case 'interactions':
        return 'Review your recent activity and interactions';
      case 'account-history':
        return 'Track changes to your profile and startups';
      case 'ad-activity':
        return 'Review your recent ad activity';
      default:
        return 'Review your recent activity and interactions';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 sm:p-8 bg-white border-b border-gray-200">
        {/* Section Title - Show for all sections */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{getSectionTitle()}</h1>
          <p className="text-gray-600 mt-1">
            {getSectionDescription()}
          </p>
        </div>
        
        {/* Fixed Tabs and Filters for Interactions Section */}
        {activeSection === 'interactions' && (
          <div className="space-y-6">
            {/* Tabs */}
            <nav className="flex items-center space-x-8 border-b border-gray-200 mb-6">
              {interactionTabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => handleTabChange(tab.value)}
                  className={`pb-3 font-semibold text-xs sm:text-sm tracking-wider uppercase transition-colors
                    ${
                      selectedTab === tab.value
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Filters */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-sm sm:text-base">{getSortText()}</h3>
              <div className="flex items-center space-x-6">
                <button 
                  onClick={handleOpenModal}
                  className="font-semibold text-sm hover:text-primary transition-colors"
                >
                  Sort & filter
                </button>
                <button className="font-semibold text-sm text-blue-500 hover:text-blue-400">
                  Select
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Fixed Tabs and Filters for Account History Section */}
        {activeSection === 'account-history' && (
          <div className="space-y-6">
            {/* Tabs */}
            <nav className="flex items-center space-x-8 border-b border-gray-200 mb-6">
              {[
                { value: '', label: 'All Changes' },
                { value: 'profile_info', label: 'Profile Info' },
                { value: 'startups', label: 'Startups' },
                { value: 'bio_description', label: 'Bio & Description' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => handleAccountHistoryTabChange(tab.value)}
                  className={`pb-3 font-semibold text-xs sm:text-sm tracking-wider uppercase transition-colors
                    ${
                      selectedAccountHistoryTab === tab.value
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Filters */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-sm sm:text-base">{getAccountHistorySortText()}</h3>
              <div className="flex items-center space-x-6">
                <button 
                  onClick={handleAccountHistoryOpenModal}
                  className="font-semibold text-sm hover:text-primary transition-colors"
                >
                  Sort & filter
                </button>
                <button className="font-semibold text-sm text-blue-500 hover:text-blue-400">
                  Select
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="p-4 sm:p-8">
          {activeSection === 'account-history' ? (
            // Account History Section
            <AccountHistory 
              userId={session?.user?.id || ''}
              selectedTab={selectedAccountHistoryTab}
              onTabChange={handleAccountHistoryTabChange}
              filters={accountHistoryFilters}
              onRefresh={() => {}}
              loading={false}
            />
          ) : activeSection === 'interactions' ? (
            // Interactions Section - Content Grid Only
            <ActivityContentGrid 
              activityType={getActivityType()}
              userId={session?.user?.id}
              filters={currentFilters}
              showAnalytics={false}
            />
          ) : (
            // Other Activity Sections
            <ActivityContentGrid 
              activityType={getActivityType()}
              userId={session?.user?.id}
              filters={currentFilters}
              showAnalytics={false}
            />
          )}
        </div>
      </div>

      {/* Sort & Filter Modal - Only for non-account-history sections */}
      {/* Temporarily disabled for debugging */}
      {/* {activeSection !== 'account-history' && (
        <SortFilterModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onApply={handleApplyFilters}
        />
      )}
      
      Sort & Filter Modal for Account History
      {activeSection === 'account-history' && (
        <SortFilterModal
          isOpen={isAccountHistoryModalOpen}
          onClose={handleAccountHistoryCloseModal}
          onApply={handleAccountHistoryApplyFilters}
        />
      )} */}
    </div>
  );
};

export default ActivityMainContent;
