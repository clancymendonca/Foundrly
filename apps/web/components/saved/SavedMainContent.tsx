'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import SavedStartupsList from './SavedStartupsList';
import SavedUsersList from './SavedUsersList';
import SortFilterModal from '@/components/search/SortFilterModal';

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

interface SavedMainContentProps {
  activeSection: string;
}

// Tab options for saved startups
const savedStartupsTabs = [
  { value: 'all', label: 'All Saved' },
  { value: 'categories', label: 'Categories' },
];

const SavedMainContent = ({ activeSection }: SavedMainContentProps) => {
  const { data: session } = useSession();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
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

  // Handle categories loaded from child component
  const handleCategoriesLoaded = (loadedCategories: string[]) => {
    setCategories(loadedCategories);
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleApplyFilters = (filters: FilterState) => {
    setCurrentFilters(filters);
    console.log('Applied filters:', filters);
  };

  const handleTabChange = (tabValue: string) => {
    setSelectedTab(tabValue);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const getSortText = () => {
    return currentFilters.sortBy === 'newest' ? 'Newest to oldest' : 'Oldest to newest';
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'saved-startups':
        return 'Saved Startups';
      case 'saved-users':
        return 'Saved Users';
      default:
        return 'Saved Startups';
    }
  };

  const getSectionDescription = () => {
    switch (activeSection) {
      case 'saved-startups':
        return 'Review and manage your saved startup pitches';
      case 'saved-users':
        return 'Manage your saved user profiles';
      default:
        return 'Review and manage your saved startup pitches';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 sm:p-8 bg-white border-b border-gray-200">
        {/* Section Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{getSectionTitle()}</h1>
          <p className="text-gray-600 mt-1">
            {getSectionDescription()}
          </p>
        </div>
        
        {/* Fixed Tabs and Filters for Saved Startups Section */}
        {activeSection === 'saved-startups' && (
          <div className="space-y-6">
            {/* Tabs */}
            <nav className="flex items-center space-x-8 border-b border-gray-200 mb-6">
              {savedStartupsTabs.map((tab) => (
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

            {/* Category Tabs or Filters */}
            {selectedTab === 'categories' ? (
              <div className="mb-6">
                <nav className="flex items-center space-x-6 border-b border-gray-200">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryChange(category)}
                      className={`pb-3 font-semibold text-xs sm:text-sm tracking-wider uppercase transition-colors
                        ${
                          selectedCategory === category
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      {category}
                    </button>
                  ))}
                </nav>
              </div>
            ) : (
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
            )}
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="p-4 sm:p-8">
          {activeSection === 'saved-startups' ? (
            // Saved Startups Section
            <SavedStartupsList 
              savedStartups={[]} 
              userId={session?.user?.id || ''}
              selectedTab={selectedTab}
              selectedCategory={selectedCategory}
              onCategoriesLoaded={handleCategoriesLoaded}
            />
          ) : activeSection === 'saved-users' ? (
            // Saved Users Section
            <SavedUsersList />
          ) : (
            // Default fallback
            <SavedStartupsList 
              savedStartups={savedStartups || []} 
              userId={session?.user?.id || ''} 
            />
          )}
        </div>
      </div>

      {/* Sort & Filter Modal */}
      <SortFilterModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onApply={handleApplyFilters}
      />
    </div>
  );
};

export default SavedMainContent;
