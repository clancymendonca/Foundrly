'use client';

import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';

interface SortFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
}

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

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
const years = Array.from({ length: 10 }, (_, i) => (2025 - i).toString());

export default function SortFilterModal({ isOpen, onClose, onApply }: SortFilterModalProps) {
  const [filters, setFilters] = useState<FilterState>({
    sortBy: 'oldest',
    startDate: {
      month: 'January',
      day: '26',
      year: '2017'
    },
    endDate: {
      month: 'August',
      day: '27',
      year: '2025'
    }
  });

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
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
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            <X size={20} />
          </button>
          <h2 className="text-gray-900 font-semibold text-lg">Sort & filter</h2>
          <button
            onClick={handleReset}
            className="text-gray-600 hover:text-gray-800 transition-colors text-sm"
          >
            Reset
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Sort by */}
          <div>
            <label className="block text-gray-900 font-medium mb-3">Sort by</label>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilters(prev => ({ ...prev, sortBy: 'newest' }))}
                className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                  filters.sortBy === 'newest'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Newest to oldest
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, sortBy: 'oldest' }))}
                className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                  filters.sortBy === 'oldest'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Oldest to newest
              </button>
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-gray-900 font-medium mb-3">Start Date</label>
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <select
                  value={filters.startDate.month}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    startDate: { ...prev.startDate, month: e.target.value }
                  }))}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 py-2 px-3 rounded appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
              </div>
              <div className="flex-1 relative">
                <select
                  value={filters.startDate.day}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    startDate: { ...prev.startDate, day: e.target.value }
                  }))}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 py-2 px-3 rounded appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
              </div>
              <div className="flex-1 relative">
                <select
                  value={filters.startDate.year}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    startDate: { ...prev.startDate, year: e.target.value }
                  }))}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 py-2 px-3 rounded appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
              </div>
            </div>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-gray-900 font-medium mb-3">End Date</label>
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <select
                  value={filters.endDate.month}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    endDate: { ...prev.endDate, month: e.target.value }
                  }))}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 py-2 px-3 rounded appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
              </div>
              <div className="flex-1 relative">
                <select
                  value={filters.endDate.day}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    endDate: { ...prev.endDate, day: e.target.value }
                  }))}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 py-2 px-3 rounded appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
              </div>
              <div className="flex-1 relative">
                <select
                  value={filters.endDate.year}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    endDate: { ...prev.endDate, year: e.target.value }
                  }))}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 py-2 px-3 rounded appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* Apply Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleApply}
            className="w-full bg-primary text-white py-3 rounded font-medium hover:bg-primary/90 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
