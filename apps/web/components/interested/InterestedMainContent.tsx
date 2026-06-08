'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import InterestedStartupsList from './InterestedStartupsList';
import SortFilterModal from '@/components/search/SortFilterModal';
import InterestedUsersManager from './InterestedUsersManager';

interface FilterState {
  sortBy: 'newest' | 'oldest';
  startDate: { month: string; day: string; year: string };
  endDate: { month: string; day: string; year: string };
}

interface InterestedMainContentProps {
  activeSection: string;
}

const interestedStartupsTabs = [
  { value: 'all', label: 'All Interested' },
  { value: 'categories', label: 'Categories' },
];

const InterestedMainContent = ({ activeSection }: InterestedMainContentProps) => {
  const { data: session } = useSession();

  // Core states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [currentFilters, setCurrentFilters] = useState<FilterState>({
    sortBy: 'newest',
    startDate: { month: 'January', day: '1', year: '2025' },
    endDate: { month: 'December', day: '31', year: '2025' },
  });

  // AI matching states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiMatchedUserIds, setAiMatchedUserIds] = useState<string[]>([]);

  // Categories handler
  const handleCategoriesLoaded = (loadedCategories: string[]) => {
    setCategories(loadedCategories);
  };

  const handleApplyFilters = (filters: FilterState) => {
    setCurrentFilters(filters);
    console.log('Applied filters:', filters);
  };

  const getSortText = () =>
    currentFilters.sortBy === 'newest' ? 'Newest to oldest' : 'Oldest to newest';

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'interested-startups':
        return 'Interested Startups';
      case 'manage-interested-users':
        return 'Manage Interested Users';
      default:
        return 'Interested Startups';
    }
  };

  const getSectionDescription = () => {
    switch (activeSection) {
      case 'interested-startups':
        return 'Browse all startups that have shown interest.';
      case 'manage-interested-users':
        return 'AI-powered matching to find the most suitable interested users.';
      default:
        return '';
    }
  };

  // AI Matching Handler
  const handleAIMatch = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiMatchedUserIds([]);

    try {
      const response = await fetch('/api/interested-submissions');
      const data = await response.json();

      const profiles = (data.submissions || []).map((sub: any) => ({
        _id: sub._id,
        name: sub.name,
        email: sub.email,
        company: sub.company,
        startupTitle: sub.startupTitle,
        investmentAmount: sub.investmentAmount,
        role: sub.role,
        status: sub.status,
        notes: sub.notes,
      }));

      const aiRes = await fetch('/api/match-cofounder-investor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profiles }),
      });

      const aiData = await aiRes.json();
      const parsed =
        typeof aiData.matches === 'string'
          ? JSON.parse(aiData.matches)
          : aiData.matches;

      if (Array.isArray(parsed)) {
        const ids = parsed
          .map((m: any) => (typeof m === 'string' ? m : m._id))
          .filter(Boolean);
        setAiMatchedUserIds(ids);
      }
    } catch (err) {
      setAiError('Failed to get matches.');
    } finally {
      setAiLoading(false);
    }
  };

  // Auto-fetch matches when filters change
  useEffect(() => {
    if (activeSection === 'manage-interested-users') {
      handleAIMatch();
    }
  }, [activeSection, currentFilters]);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 sm:p-8 bg-white border-b border-gray-200">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{getSectionTitle()}</h1>
          <p className="text-gray-600 mt-1">{getSectionDescription()}</p>
        </div>

        {activeSection === 'interested-startups' && (
          <div className="space-y-6">
            {/* Tabs */}
            <nav className="flex items-center space-x-8 border-b border-gray-200 mb-6">
              {interestedStartupsTabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setSelectedTab(tab.value)}
                  className={`pb-3 font-semibold text-xs sm:text-sm uppercase transition-colors
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

            {selectedTab === 'categories' ? (
              <div className="mb-6">
                <nav className="flex items-center space-x-6 border-b border-gray-200">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`pb-3 font-semibold text-xs sm:text-sm uppercase transition-colors
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
                    onClick={() => setIsModalOpen(true)}
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
          {activeSection === 'interested-startups' && (
            <InterestedStartupsList
              interestedStartups={[]}
              userId={session?.user?.id || ''}
              selectedTab={selectedTab}
              selectedCategory={selectedCategory}
              onCategoriesLoaded={handleCategoriesLoaded}
            />
          )}
          {activeSection === 'manage-interested-users' && (
            <InterestedUsersManager
              userId={session?.user?.id || ''}
              topMatchedIds={aiMatchedUserIds}
            />
          )}
        </div>
      </div>

      {/* Sort & Filter Modal */}
      <SortFilterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApply={handleApplyFilters}
      />
    </div>
  );
};

export default InterestedMainContent;
