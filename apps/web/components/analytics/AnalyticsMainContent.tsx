"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import ActivityContentGrid from '@/components/activity/ActivityContentGrid';
import SortFilterModal from '@/components/search/SortFilterModal';
import StartupAnalyticsDashboard from './StartupAnalyticsDashboard';
import StartupEngagementMetrics from './StartupEngagementMetrics';

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

interface AnalyticsMainContentProps {
  activeSection: string;
  initialStartupId?: string | null;
}

const interactionTabs = [
  { value: 'all', label: 'All' },
  { value: 'Technology', label: 'Technology' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Finance', label: 'Finance' },
  { value: 'E-commerce', label: 'E-commerce' },
  { value: 'Education', label: 'Education' },
  { value: 'AI/ML', label: 'AI/ML' },
  { value: 'SaaS', label: 'SaaS' },
  { value: 'Fintech', label: 'Fintech' },
  { value: 'Social', label: 'Social' },
];

export default function AnalyticsMainContent({ activeSection, initialStartupId }: AnalyticsMainContentProps) {
  const { data: session } = useSession();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedStartupId, setSelectedStartupId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [currentFilters, setCurrentFilters] = useState<FilterState>({
    sortBy: 'newest',
    startDate: { month: 'January', day: '1', year: '2025' },
    endDate: { month: 'December', day: '31', year: '2025' }
  });
  const [selectedStartupForEngagement, setSelectedStartupForEngagement] = useState<{ id: string, title: string } | null>(null);

  // Sync an initial startup id from parent (e.g., query param) into local state
  useEffect(() => {
    if (initialStartupId) {
      setSelectedStartupId(initialStartupId);
    }
  }, [initialStartupId]);

  // Fetch available categories from user's startups
  useEffect(() => {
    const fetchCategories = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/analytics/categories?userId=${session.user.id}`);
        const data = await response.json();
        if (data.success && data.categories) {
          setAvailableCategories(data.categories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    if (activeSection === 'engagement-audience' || activeSection === 'startup-analytics') {
      fetchCategories();
    }
  }, [session?.user?.id, activeSection]);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleApplyFilters = (filters: FilterState) => {
    setCurrentFilters(filters);
  };

  const handleTabChange = (tabValue: string) => {
    setSelectedTab(tabValue);
  };

  const handleAnalyticsClick = (startupId: string, title: string) => {
    setSelectedStartupForEngagement({ id: startupId, title: title || 'Startup' });
  };

  const handleBackFromEngagement = () => {
    setSelectedStartupForEngagement(null);
  };

  const getSortText = () => currentFilters.sortBy === 'newest' ? 'Newest to oldest' : 'Oldest to newest';

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'engagement-audience':
        return 'Engagement & Network';
      case 'startup-analytics':
      default:
        return 'Startup Analytics';
    }
  };

  const getSectionDescription = () => {
    switch (activeSection) {
      case 'engagement-audience':
        return 'Track likes, dislikes, comments, views, and your follower network growth';
      case 'startup-analytics':
      default:
        return 'Compare your startups with market benchmarks and similar startups using AI-powered analytics';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 sm:p-8 bg-white border-b border-gray-200">
        <div className="mb-6 flex items-start justify-between pr-20">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{getSectionTitle()}</h1>
            <p className="text-gray-600 mt-1">{getSectionDescription()}</p>
          </div>
          {(selectedStartupForEngagement || selectedStartupId) && (
            <Button 
              variant="outline" 
              onClick={() => {
                if (selectedStartupForEngagement) handleBackFromEngagement();
                if (selectedStartupId) setSelectedStartupId(null);
              }}
              className="ml-4 shrink-0"
            >
              Back
            </Button>
          )}
        </div>

        {(activeSection === 'engagement-audience' && !selectedStartupForEngagement) || (activeSection === 'startup-analytics' && !selectedStartupId) ? (
          <div className="space-y-6">
            {/* Tabs */}
            <nav className="flex items-center space-x-8 border-b border-gray-200 mb-6 overflow-x-auto">
              {/* Use dynamic categories for both sections */}
              {availableCategories.length > 0 ? availableCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleTabChange(category === 'All' ? 'all' : category)}
                  className={`pb-3 font-semibold text-xs sm:text-sm tracking-wider uppercase transition-colors whitespace-nowrap
                    ${
                      selectedTab === (category === 'All' ? 'all' : category)
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {category}
                </button>
              )) : (
                // Fallback to static tabs while loading
                interactionTabs.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => handleTabChange(tab.value)}
                    className={`pb-3 font-semibold text-xs sm:text-sm tracking-wider uppercase transition-colors whitespace-nowrap
                      ${
                        selectedTab === tab.value
                          ? 'text-primary border-b-2 border-primary'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))
              )}
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
        ) : null}
      </div>

      {/* Scrollable Content */}
      <div className={`flex-1 ${(selectedStartupForEngagement || selectedStartupId) ? 'overflow-hidden' : 'overflow-y-auto scrollbar-hide'} min-h-0`}>
        <div className={(activeSection === 'engagement-audience' ? 'p-4 pt-2 sm:pt-4 sm:px-8' : 'p-4 sm:p-8') + ' h-full flex flex-col min-h-0 pb-20'}>
          {activeSection === 'engagement-audience' ? (
            selectedStartupForEngagement ? (
              <div className="flex-1 min-h-0 flex flex-col space-y-6">
                <div className="flex-1 min-h-0">
                  <StartupEngagementMetrics
                    startupId={selectedStartupForEngagement.id}
                    startupTitle={selectedStartupForEngagement.title}
                    onBack={handleBackFromEngagement}
                  />
                </div>
              </div>
            ) : (
              <ActivityContentGrid 
                activityType={selectedTab}
                userId={session?.user?.id}
                filters={currentFilters}
                onlyOwnStartups={true}
                showAnalytics={true}
                onAnalyticsClick={handleAnalyticsClick}
              />
            )
          ) : (
            <div className="flex-1 min-h-0 flex flex-col space-y-6">
              {selectedStartupId ? (
                <div className="flex-1 min-h-0 flex flex-col">
                  <div className="flex-1 min-h-0 px-4 sm:pr-20 pb-16 overflow-y-auto max-h-[calc(100vh-12rem)]">
                    <StartupAnalyticsDashboard startupId={selectedStartupId} />
                  </div>
                </div>
              ) : (
                <div className="px-4 sm:px-0">
                  <ActivityContentGrid 
                    activityType="startup-selection"
                    userId={session?.user?.id}
                    filters={currentFilters}
                    onlyOwnStartups={true}
                    onStartupSelect={setSelectedStartupId}
                    selectedCategory={selectedCategory}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sort & Filter Modal */}
      {activeSection === 'engagement-audience' && (
        <SortFilterModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onApply={handleApplyFilters}
        />
      )}
    </div>
  );
}