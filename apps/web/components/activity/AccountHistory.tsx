'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  Edit, 
  ChevronRight, 
  Shield,
  User,
  FileText,
  Image,
  Mail,
  AtSign,
  Eye,
  Plus,
  Trash2,
  RefreshCw,
  Filter
} from 'lucide-react';
import SortFilterModal from '@/components/search/SortFilterModal';

type HistoryEvent = {
  _id: string;
  changeType: string;
  timestamp: string;
  oldValue?: string;
  newValue?: string;
  startupId?: string;
  startupTitle?: string;
  changeDetails?: {
    field: string;
    oldData?: string;
    newData?: string;
  };
  ipAddress?: string;
  userAgent?: string;
};

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

// Icon mapping for different change types
const changeTypeIcons: Record<string, React.ReactNode> = {
  name_change: <User className="h-6 w-6 text-gray-500 flex-shrink-0" />,
  bio_change: <FileText className="h-6 w-6 text-gray-500 flex-shrink-0" />,
  image_change: <Image className="h-6 w-6 text-gray-500 flex-shrink-0" />,
  email_change: <Mail className="h-6 w-6 text-gray-500 flex-shrink-0" />,
  username_change: <AtSign className="h-6 w-6 text-gray-500 flex-shrink-0" />,
  privacy_change: <Eye className="h-6 w-6 text-gray-500 flex-shrink-0" />,
  startup_created: <Plus className="h-6 w-6 text-gray-500 flex-shrink-0" />,
  startup_updated: <Edit className="h-6 w-6 text-gray-500 flex-shrink-0" />,
  startup_deleted: <Trash2 className="h-6 w-6 text-gray-500 flex-shrink-0" />,
  account_created: <User className="h-6 w-6 text-gray-500 flex-shrink-0" />,
};

// Labels for different change types
const changeTypeLabels: Record<string, string> = {
  name_change: 'Profile Name Changed',
  bio_change: 'Profile Bio Changed',
  image_change: 'Profile Picture Changed',
  email_change: 'Email Changed',
  username_change: 'Username Changed',
  privacy_change: 'Privacy Setting Changed',
  startup_created: 'Startup Created',
  startup_updated: 'Startup Updated',
  startup_deleted: 'Startup Deleted',
  account_created: 'Account Created',
};

// Tab options for different change types
const tabs = [
  { value: '', label: 'All Changes' },
  { value: 'profile_info', label: 'Profile Info' },
  { value: 'startups', label: 'Startups' },
  { value: 'bio_description', label: 'Bio & Description' },
];

interface AccountHistoryProps {
  userId: string;
  selectedTab: string;
  onTabChange: (tabValue: string) => void;
  filters: {
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
  };
  onRefresh: () => void;
  loading: boolean;
}

const AccountHistory = ({ 
  userId, 
  selectedTab, 
  onTabChange, 
  filters, 
  onRefresh, 
  loading 
}: AccountHistoryProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState<HistoryEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedChangeType, setSelectedChangeType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleApplyFilters = (filters: FilterState) => {
    console.log('Applied filters:', filters);
  };

  const getSortText = () => {
    return filters.sortBy === 'newest' ? 'Newest to oldest' : 'Oldest to newest';
  };

  // Handle tab change
  const handleTabChange = (changeType: string) => {
    onTabChange(changeType);
  };

  // Fetch account history data
  const fetchHistoryData = async () => {
    console.log('AccountHistory: fetchHistoryData called with userId:', userId);
    
    if (!userId) {
      console.warn('AccountHistory: No userId provided');
      setError('No user ID provided');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: '50',
        offset: '0'
      });

      // Map category values to actual change types
      let changeTypeFilter = '';
      if (selectedChangeType === 'profile_info') {
        // Profile info includes name, email, username, image changes
        changeTypeFilter = 'name_change,email_change,username_change,image_change';
      } else if (selectedChangeType === 'startups') {
        // Startups includes creation, updates, deletions
        changeTypeFilter = 'startup_created,startup_updated,startup_deleted';
      } else if (selectedChangeType === 'bio_description') {
        // Bio and description changes
        changeTypeFilter = 'bio_change';
      } else if (selectedChangeType) {
        // For any other specific change type
        changeTypeFilter = selectedChangeType;
      }

      console.log('AccountHistory: selectedChangeType:', selectedChangeType);
      console.log('AccountHistory: changeTypeFilter:', changeTypeFilter);

      if (changeTypeFilter) {
        params.append('changeType', changeTypeFilter);
      }

      const url = `/api/user/account-history?${params}`;
      console.log('AccountHistory: Fetching from URL:', url);

      const response = await fetch(url);
      console.log('AccountHistory: Response status:', response.status);
      
      const data = await response.json();
      console.log('AccountHistory: Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch account history');
      }

      setHistoryData(data.history || []);
      console.log('AccountHistory: Set history data:', data.history);
    } catch (err) {
      console.error('AccountHistory: Error fetching account history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch account history');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount and when filter changes
  useEffect(() => {
    console.log('AccountHistory: useEffect triggered with userId:', userId);
    if (userId) {
      fetchHistoryData();
    }
  }, [selectedChangeType, userId]);
  
  // Update selectedChangeType when selectedTab prop changes
  useEffect(() => {
    setSelectedChangeType(selectedTab);
  }, [selectedTab]);

  // Apply sorting based on filters prop
  const sortedHistoryData = useMemo(() => {
    const sorted = [...historyData];
    
    if (filters.sortBy === 'newest') {
      // Sort by timestamp in descending order (newest first)
      sorted.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else {
      // Sort by timestamp in ascending order (oldest first)
      sorted.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }
    
    return sorted;
  }, [historyData, filters.sortBy]);

  // Format timestamp to relative time
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    return `${Math.floor(diffInSeconds / 31536000)}y ago`;
  };

  // Truncate long values
  const truncateValue = (value: string, maxLength = 50) => {
    if (!value) return '';
    return value.length > maxLength ? `${value.substring(0, maxLength)}...` : value;
  };

  return (
    <div className="space-y-6 px-4 sm:pr-20">

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border-[5px] border-red-200 rounded-[22px] shadow-200 mb-6 max-w-md mx-auto sm:max-w-none">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && historyData.length === 0 && (
        <div className="text-center py-8 max-w-md mx-auto sm:max-w-none">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">Loading account history...</p>
        </div>
      )}

      {/* History List */}
      {!isLoading && (
        <div className="space-y-4 max-w-md mx-auto sm:max-w-none">
          {sortedHistoryData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {selectedChangeType === 'profile_info' 
                  ? 'No profile information changes found. Profile changes will appear here when you update your name, email, username, or profile picture.'
                  : selectedChangeType === 'startups'
                  ? 'No startup-related changes found. Startup changes will appear here when you create, update, or delete startups.'
                  : selectedChangeType === 'bio_description'
                  ? 'No bio or description changes found. Bio changes will appear here when you update your bio or description.'
                  : 'No account history found.'
                }
              </p>
            </div>
          ) : (
            sortedHistoryData.map((event) => (
              <div
                key={event._id}
                className="p-4 bg-white border-[5px] border-black rounded-[22px] shadow-200 hover:shadow-300 hover:border-primary transition-all duration-500"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
                      {changeTypeIcons[event.changeType] || <User className="h-6 w-6 text-gray-500 flex-shrink-0" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">
                          {changeTypeLabels[event.changeType] || event.changeType}
                        </h4>
                        {event.startupTitle && (
                          <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {event.startupTitle}
                          </span>
                        )}
                      </div>
                      
                      {/* Change Details */}
                      {(event.oldValue || event.newValue) && (
                        <div className="text-sm text-gray-600 mb-2">
                          {event.oldValue && (
                            <div className="mb-1">
                              <span className="font-medium">From:</span> {truncateValue(event.oldValue)}
                            </div>
                          )}
                          {event.newValue && (
                            <div>
                              <span className="font-medium">To:</span> {truncateValue(event.newValue)}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="text-xs text-gray-500">
                        {formatTimestamp(event.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Sort & Filter Modal */}
      <SortFilterModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onApply={handleApplyFilters}
      />
    </div>
  );
};

export default AccountHistory;
