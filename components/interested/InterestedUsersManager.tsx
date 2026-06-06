'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { InterestedSubmission } from '@/sanity/types';
import { 
  Eye, 
  Mail, 
  Phone, 
  ExternalLink, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  ChevronDown,
  Circle,
  UserCheck,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Archive
} from 'lucide-react';
import ChatController from '@/components/chat/ChatController';

interface InterestedUsersManagerProps {
  userId: string;
}

const InterestedUsersManager: React.FC<InterestedUsersManagerProps> = ({ userId }) => {

  const [submissions, setSubmissions] = useState<InterestedSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<InterestedSubmission | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openFilterDropdown, setOpenFilterDropdown] = useState(false);
  const [emailSendingFor, setEmailSendingFor] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialChatId, setInitialChatId] = useState<string | null>(null);
  const [chatLoadingFor, setChatLoadingFor] = useState<string | null>(null);
  const buildInterestedEmailHtml = (
    title: string,
    greetingName: string,
    bodyHtml: string,
    cta?: { text: string; href: string }
  ) => `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; background-color: #F7F7F7; padding: 24px; color: #141413;">
        <div style="max-width: 600px; margin: auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
          <div style="background-color: #4E71FF; padding: 16px; text-align: center;">
            <h1 style="color: #FFFFFF; margin: 0; font-size: 20px;">${title}</h1>
          </div>

          <div style="padding: 24px;">
            <p style="margin: 0 0 16px 0; color: #141413;">Hi ${greetingName},</p>
            ${bodyHtml}
            ${cta ? `
              <div style="text-align: center; margin: 32px 0;">
                <a href="${cta.href}"
                  style="
                    display: inline-block;
                    background-color: #FBE843;
                    color: #141413;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-weight: bold;
                    text-decoration: none;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                  ">
                  ${cta.text}
                </a>
              </div>
            ` : ''}
            <p style="margin-top: 20px; color: #7D8087;">Best regards,</p>
            <p style="margin: 0; color: #7D8087;">Your Team</p>
          </div>

          <div style="background-color: #333333; color: #FFFFFF; text-align: center; padding: 12px; font-size: 12px;">
            © ${new Date().getFullYear()} Interested Users Manager. All rights reserved.
          </div>
        </div>
      </div>
    `;
  const handleStartChatWithUser = async (targetUser: { id: string; name?: string | null; image?: string | null }) => {
    if (!userId || !targetUser?.id) return;
    try {
      setChatLoadingFor(targetUser.id);

      const upsertResponse = await fetch('/api/chat/upsert-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: targetUser.id,
          name: targetUser.name || undefined,
          image: targetUser.image || undefined,
        }),
      });
      if (!upsertResponse.ok && upsertResponse.status === 403) {
        const err = await upsertResponse.json().catch(() => ({}));
        throw new Error(err?.error || 'Not allowed to message');
      }

      const channelResp = await fetch('/api/chat/create-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          memberIds: [userId, targetUser.id],
          channelData: {
            name: targetUser.name ? `Chat with ${targetUser.name}` : 'Direct chat',
            image: targetUser.image || undefined,
          },
        }),
      });
      if (!channelResp.ok) {
        const details = await channelResp.json().catch(() => ({}));
        throw new Error(details?.details || details?.error || 'Failed to create/open chat');
      }
      const { channelId } = await channelResp.json();
      if (channelId) {
        setInitialChatId(channelId);
        setIsChatOpen(true);
      }
    } catch (e) {
      // Optionally show toast
    } finally {
      setChatLoadingFor(null);
    }
  };

  // AI Matching State
  const [aiMatches, setAiMatches] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [topMatchedIds, setTopMatchedIds] = useState<string[]>([]);

  // AI Matching Handler
  const handleAIMatch = async () => {
    setAiLoading(true);
    setAiError(null);
  setAiMatches(null);
  setTopMatchedIds([]);
    try {
      // Prepare profiles for matching (simplified)
      const profiles = filteredSubmissions.map(sub => ({
        name: sub.name,
        email: sub.email,
        company: sub.company,
        startupTitle: sub.startupTitle,
        investmentAmount: sub.investmentAmount,
        role: sub.role,
        status: sub.status,
        notes: sub.notes,
      }));
      const response = await fetch('/api/match-cofounder-investor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profiles }),
      });
      const data = await response.json();
      setAiMatches(data.matches);
      // Try to parse top matches from AI response (assume JSON array of IDs or objects with _id)
      try {
        let parsed;
        if (typeof data.matches === 'string') {
          parsed = JSON.parse(data.matches);
        } else {
          parsed = data.matches;
        }
        // If array of objects with _id, extract _id; if array of strings, use directly
        if (Array.isArray(parsed)) {
          const ids = parsed.map(m => typeof m === 'string' ? m : m._id).filter(Boolean);
          setTopMatchedIds(ids);
        }
      } catch (e) {
        // If parsing fails, fallback to showing all
        setTopMatchedIds([]);
      }
    } catch (err) {
      setAiError('Failed to get matches.');
    } finally {
      setAiLoading(false);
    }
  };

  // Fetch submissions on component mount
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await fetch('/api/interested-submissions');
        if (response.ok) {
          const data = await response.json();
          setSubmissions(data.submissions || []);
        }
      } catch (error) {
        console.error('Error fetching submissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && !(event.target as Element).closest('.status-dropdown')) {
        setOpenDropdown(null);
      }
      if (openFilterDropdown && !(event.target as Element).closest('.filter-dropdown')) {
        setOpenFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown, openFilterDropdown]);

  // ...existing code...
  // Filter and search submissions
  const filteredSubmissions = useMemo(() => {
    let filtered = submissions.filter(submission => {
      const matchesSearch = 
        (submission.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (submission.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (submission.startupTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (submission.company?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
      const matchesRole = selectedRole === 'all' || submission.role === selectedRole;
      return matchesSearch && matchesStatus && matchesRole;
    });
    // If topMatchedIds is set, filter to only those
    if (topMatchedIds && topMatchedIds.length > 0) {
      filtered = filtered.filter(sub => topMatchedIds.includes(sub._id));
    }
    return filtered;
  }, [submissions, searchTerm, statusFilter, topMatchedIds, selectedRole]);

  // Status statistics
  const statusStats = useMemo(() => {
    const stats = {
      new: 0,
      contacted: 0,
      'in-discussion': 0,
      interested: 0,
      'not-interested': 0,
      closed: 0,
    };
    
    submissions.forEach(submission => {
      if (submission.status && stats.hasOwnProperty(submission.status)) {
        stats[submission.status as keyof typeof stats]++;
      }
    });
    
    return stats;
  }, [submissions]);

  const handleStatusUpdate = async (submissionId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/interested-submissions/update-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, status: newStatus }),
      });

      if (response.ok) {
        setSubmissions(prev => 
          prev.map(sub => 
            sub._id === submissionId 
              ? { ...sub, status: newStatus as any }
              : sub
          )
        );
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleNotesUpdate = async (submissionId: string, newNotes: string) => {
    try {
      const response = await fetch('/api/interested-submissions/update-notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, notes: newNotes }),
      });

      if (response.ok) {
        setSubmissions(prev => 
          prev.map(sub => 
            sub._id === submissionId 
              ? { ...sub, notes: newNotes }
              : sub
          )
        );
        setEditingNotes(false);
      }
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  const handleDelete = async (submissionId: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) return;

    try {
      const response = await fetch('/api/interested-submissions/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      });

      if (response.ok) {
        setSubmissions(prev => prev.filter(sub => sub._id !== submissionId));
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error deleting submission:', error);
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Company', 'Role', 'Startup', 'Investment Amount', 'Status', 'Submitted Date'].join(','),
      ...filteredSubmissions.map(sub => [
        sub.name ?? '',
        sub.email ?? '',
        sub.phone ?? '',
        sub.company ?? '',
        sub.role ?? '',
        sub.startupTitle ?? '',
        sub.investmentAmount ?? '',
        sub.status ?? '',
        sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'interested-submissions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const statusOptions = [
    { value: 'new', label: 'New', icon: Circle, color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'contacted', label: 'Contacted', icon: UserCheck, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { value: 'in-discussion', label: 'In Discussion', icon: MessageCircle, color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { value: 'interested', label: 'Interested', icon: ThumbsUp, color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'not-interested', label: 'Not Interested', icon: ThumbsDown, color: 'bg-red-100 text-red-800 border-red-200' },
    { value: 'closed', label: 'Closed', icon: Archive, color: 'bg-gray-100 text-gray-800 border-gray-200' },
  ];

  const getStatusConfig = (status: string) => {
    return statusOptions.find(option => option.value === status) || statusOptions[0];
  };

  const getStatusColor = (status: string) => {
    return getStatusConfig(status).color;
  };

  const filterOptions = [
    { value: 'all', label: 'All Status', count: submissions.length, icon: Filter, color: 'bg-gray-100 text-gray-800 border-gray-200' },
    ...statusOptions.map(option => ({
      ...option,
      count: statusStats[option.value as keyof typeof statusStats] || 0
    }))
  ];

  const getFilterConfig = (filter: string) => {
    return filterOptions.find(option => option.value === filter) || filterOptions[0];
  };

  const roleOptions = [
    { value: 'investor', label: 'Investor', icon: Filter, color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'angel-investor', label: 'Angel Investor', icon: Filter, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { value: 'vc', label: 'Venture Capitalist', icon: Filter, color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { value: 'founder', label: 'Startup Founder', icon: Filter, color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'entrepreneur', label: 'Entrepreneur', icon: Filter, color: 'bg-red-100 text-red-800 border-red-200' },
    { value: 'advisor', label: 'Advisor', icon: Filter, color: 'bg-gray-100 text-gray-800 border-gray-200' },
    { value: 'mentor', label: 'Mentor', icon: Filter, color: 'bg-gray-100 text-gray-800 border-gray-200' },
    { value: 'employee', label: 'Employee', icon: Filter, color: 'bg-gray-100 text-gray-800 border-gray-200' },
    { value: 'student', label: 'Student', icon: Filter, color: 'bg-gray-100 text-gray-800 border-gray-200' },
    { value: 'other', label: 'Other', icon: Filter, color: 'bg-gray-100 text-gray-800 border-gray-200' },
  ];
  const [openRoleFilterDropdown, setOpenRoleFilterDropdown] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interested users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pr-20">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{statusStats.new}</div>
          <div className="text-sm text-gray-600">New</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">{statusStats.contacted}</div>
          <div className="text-sm text-gray-600">Contacted</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">{statusStats['in-discussion']}</div>
          <div className="text-sm text-gray-600">In Discussion</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{statusStats.interested}</div>
          <div className="text-sm text-gray-600">Interested</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">{statusStats['not-interested']}</div>
          <div className="text-sm text-gray-600">Not Interested</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-600">{statusStats.closed}</div>
          <div className="text-sm text-gray-600">Closed</div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by name, email, company, or startup..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full md:w-80"
              />
            </div>
            <div className="relative filter-dropdown">
              <button
                onClick={() => setOpenFilterDropdown(!openFilterDropdown)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {(() => {
                  const config = getFilterConfig(statusFilter);
                  const Icon = config.icon;
                  return <Icon className="h-4 w-4" />;
                })()}
                <span className="text-sm font-medium">
                  {getFilterConfig(statusFilter).label} ({getFilterConfig(statusFilter).count})
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {openFilterDropdown && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                  {filterOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => {
                          setStatusFilter(option.value);
                          setOpenFilterDropdown(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          statusFilter === option.value ? 'bg-gray-100' : ''
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="flex-1 text-left">{option.label}</span>
                        <span className="text-xs text-gray-500">({option.count})</span>
                        {statusFilter === option.value && (
                          <CheckCircle className="h-4 w-4 ml-auto text-green-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="relative filter-dropdown">
              <button
                onClick={() => setOpenRoleFilterDropdown(!openRoleFilterDropdown)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={aiLoading}
              >
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {selectedRole === 'all'
                    ? 'All Roles (AI)'
                    : (roleOptions.find(opt => opt.value === selectedRole)?.label || selectedRole)
                  }
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {openRoleFilterDropdown && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                  <button
                    key="all"
                    onClick={() => {
                      setSelectedRole('all');
                      setOpenRoleFilterDropdown(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${selectedRole === 'all' ? 'bg-gray-100' : ''}`}
                  >
                    <Filter className="h-4 w-4" />
                    <span className="flex-1 text-left">All Roles (AI)</span>
                    {selectedRole === 'all' && <CheckCircle className="h-4 w-4 text-green-600" />}
                  </button>
                  {roleOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSelectedRole(option.value);
                          setOpenRoleFilterDropdown(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          selectedRole === option.value ? 'bg-gray-100' : ''
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="flex-1 text-left">{option.label}</span>
                        {selectedRole === option.value && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      {/* AI Matching Results */}
      {aiMatches && (
        <div className="my-4 p-4 bg-purple-50 border border-purple-200 rounded">
          <h3 className="text-lg font-semibold mb-2 text-purple-700">AI Matching Results</h3>
          <pre className="whitespace-pre-wrap text-sm text-gray-800">{aiMatches}</pre>
        </div>
      )}
      {aiError && (
        <div className="my-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">{aiError}</div>
      )}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide" style={{ overflowY: 'visible' }}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Person
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Startup
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Investment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubmissions.map((submission) => (
                <tr key={submission._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {submission.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {submission.email}
                      </div>
                      {submission.company && (
                        <div className="text-xs text-gray-400">
                          {submission.company}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {submission.startupTitle}
                      </div>
                      {/* Handle startup.author if available and is object */}
                      {submission.startup && typeof submission.startup === 'object' && 'author' in submission.startup && (submission.startup as any).author?.name && (
                        <div className="text-xs text-gray-500">
                          by {(submission.startup as any).author.name}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      {submission.investmentAmount && (
                        <div className="text-sm text-gray-900">
                          {submission.investmentAmount}
                        </div>
                      )}
                      {submission.role && (
                        <div className="text-xs text-gray-500 capitalize">
                          {submission.role.replace('-', ' ')}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="relative status-dropdown">
                      <button
                        onClick={() => setOpenDropdown(openDropdown === submission._id ? null : submission._id)}
                        className={`inline-flex items-center gap-2 text-xs font-semibold rounded-full px-3 py-1.5 border transition-all duration-200 hover:shadow-sm ${getStatusColor(submission.status || 'new')}`}
                      >
                        {(() => {
                          const config = getStatusConfig(submission.status || 'new');
                          const Icon = config.icon;
                          return <Icon className="h-3 w-3" />;
                        })()}
                        {getStatusConfig(submission.status || 'new').label}
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      
                      {openDropdown === submission._id && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                          {statusOptions.map((option) => {
                            const Icon = option.icon;
                            return (
                              <button
                                key={option.value}
                                onClick={() => {
                                  handleStatusUpdate(submission._id, option.value);
                                  setOpenDropdown(null);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                                  submission.status === option.value ? 'bg-gray-100' : ''
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                                <span>{option.label}</span>
                                {submission.status === option.value && (
                                  <CheckCircle className="h-4 w-4 ml-auto text-green-600" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setNotes(submission.notes || '');
                          setShowModal(true);
                        }}
                        className="text-primary hover:text-primary/80"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {(() => {
                        const relatedUserId = (submission as any).userId || (submission as any).user?._id;
                        const relatedUserName = (submission as any).user?.name || submission.name;
                        const relatedUserImage = (submission as any).user?.image || undefined;
                        if (!relatedUserId) return null;
                        const busy = chatLoadingFor === relatedUserId;
                        return (
                          <button
                            onClick={() => handleStartChatWithUser({ id: relatedUserId as string, name: relatedUserName, image: relatedUserImage })}
                            className={`text-purple-600 hover:text-purple-800 ${busy ? 'opacity-60 pointer-events-none' : ''}`}
                            title={busy ? 'Opening…' : 'Chat'}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                        );
                      })()}
                      <button
                        onClick={async () => {
                          if (!submission.email) return;
                          try {
                            setEmailSendingFor(submission._id);
                            const subject = `Re: Your interest in ${submission.startupTitle || 'our startup'}`;
                            const greetingName = submission.name || 'there';
                            const textBody = [
                              `Hi ${greetingName},`,
                              '',
                              `Thanks for your interest in ${submission.startupTitle || 'our startup'}.`,
                              submission.investmentAmount ? `You indicated interest around ${submission.investmentAmount}.` : '',
                              submission.message ? `Your note: "${submission.message}"` : '',
                              '',
                              'Would you be open to a quick chat to discuss further?',
                              '',
                              'Best regards,'
                            ].filter(Boolean).join('\n');

                            const rowBodyHtml = `
                              <p style=\"margin: 0 0 16px 0; color: #333333;\">Thanks for your interest in <strong>${submission.startupTitle || 'our startup'}</strong>.</p>
                              ${submission.investmentAmount ? `<p style=\\\"margin: 0 0 16px 0; color: #333333;\\\">You indicated interest around <strong>${submission.investmentAmount}</strong>.</p>` : ''}
                              ${submission.message ? `<blockquote style=\\\"margin: 12px 0; padding: 12px; background: #f9fafb; border-left: 4px solid #8b5cf6; color: #333333;\\\">${submission.message}</blockquote>` : ''}
                              <p style=\"margin: 0 0 16px 0; color: #333333;\">Would you be open to a quick chat to discuss further?</p>
                            `;
                            const htmlBody = buildInterestedEmailHtml(
                              'Interested Users Manager',
                              greetingName,
                              rowBodyHtml,
                              { text: 'Schedule a Chat', href: (typeof window !== 'undefined' ? window.location.origin : 'https://foundrly.com') }
                            );

                            const res = await fetch('/api/interested-submissions/send-email', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ to: submission.email, subject, body: textBody, html: htmlBody })
                            });
                            if (!res.ok) {
                              const err = await res.json().catch(() => ({}));
                              throw new Error(err?.error || 'Failed to send email');
                            }
                          } catch (err) {
                            // optionally show toast
                          } finally {
                            setEmailSendingFor(null);
                          }
                        }}
                        className={`text-green-600 hover:text-green-800 ${emailSendingFor === submission._id ? 'opacity-60 pointer-events-none' : ''}`}
                        title={emailSendingFor === submission._id ? 'Sending…' : 'Send Email'}
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                      {submission.phone && (
                        <a
                          href={`tel:${submission.phone}`}
                          className="text-blue-600 hover:text-blue-800"
                          title="Call"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(submission._id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSubmissions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No interested users found</div>
            <div className="text-gray-500 text-sm">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Users interested in your startups will appear here'
              }
            </div>
          </div>
        )}
      </div>


      {/* Detail Modal */}
      {showModal && selectedSubmission && createPortal(
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50" 
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-white rounded-[22px] shadow-200 border-[5px] border-black max-w-4xl w-full max-h-[90vh] relative animate-fade-in overflow-hidden flex flex-col">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 z-10"
              onClick={() => setShowModal(false)}
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedSubmission.name}</h2>
                  <p className="text-gray-600">Interested in: {selectedSubmission.startupTitle}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                  <div className="space-y-2">
                    <div><strong>Email:</strong> {selectedSubmission.email}</div>
                    {selectedSubmission.phone && <div><strong>Phone:</strong> {selectedSubmission.phone}</div>}
                    {selectedSubmission.company && <div><strong>Company:</strong> {selectedSubmission.company}</div>}
                    {selectedSubmission.role && <div><strong>Role:</strong> {selectedSubmission.role.replace('-', ' ')}</div>}
                    {selectedSubmission.location && <div><strong>Location:</strong> {selectedSubmission.location}</div>}
                  </div>
                </div>

                {/* Investment Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Investment Details</h3>
                  <div className="space-y-2">
                    {selectedSubmission.investmentAmount && <div><strong>Amount:</strong> {selectedSubmission.investmentAmount}</div>}
                    {selectedSubmission.investmentType && <div><strong>Type:</strong> {selectedSubmission.investmentType.replace('-', ' ')}</div>}
                    {selectedSubmission.timeline && <div><strong>Timeline:</strong> {selectedSubmission.timeline.replace('-', ' ')}</div>}
                    <div><strong>Preferred Contact:</strong> {selectedSubmission.preferredContact}</div>
                  </div>
                </div>

                {/* Professional Links */}
                {(selectedSubmission.linkedin || selectedSubmission.website) && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Professional Links</h3>
                    <div className="space-y-2">
                      {selectedSubmission.linkedin && (
                        <div>
                          <strong>LinkedIn:</strong>{' '}
                          <a href={selectedSubmission.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            View Profile <ExternalLink className="inline h-3 w-3" />
                          </a>
                        </div>
                      )}
                      {selectedSubmission.website && (
                        <div>
                          <strong>Website:</strong>{' '}
                          <a href={selectedSubmission.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Visit Site <ExternalLink className="inline h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Discovery */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Discovery</h3>
                  <div className="space-y-2">
                    {selectedSubmission.howDidYouHear && <div><strong>How they heard:</strong> {selectedSubmission.howDidYouHear.replace('-', ' ')}</div>}
                    <div><strong>Submitted:</strong> {selectedSubmission.submittedAt ? new Date(selectedSubmission.submittedAt).toLocaleString() : ''}</div>
                    <div><strong>Consent:</strong> {selectedSubmission.consentToContact ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              </div>

              {/* Experience */}
              {selectedSubmission.experience && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Experience</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-md">{selectedSubmission.experience}</p>
                </div>
              )}

              {/* Message */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Message</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-md">{selectedSubmission.message}</p>
              </div>

              {/* Notes */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Internal Notes</h3>
                  <button
                    onClick={() => setEditingNotes(!editingNotes)}
                    className="text-primary hover:text-primary/80"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
                {editingNotes ? (
                  <div className="space-y-2">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={4}
                      placeholder="Add internal notes about this submission..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleNotesUpdate(selectedSubmission._id, notes)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingNotes(false);
                          setNotes(selectedSubmission.notes || '');
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-md">
                    {selectedSubmission.notes || "No internal notes yet."}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    if (!selectedSubmission.email) return;
                    try {
                      setEmailSendingFor(selectedSubmission._id);
                      const subject = `Re: Your interest in ${selectedSubmission.startupTitle || 'our startup'}`;
                      const greetingName = selectedSubmission.name || 'there';
                      const textBody = [
                        `Hi ${greetingName},`,
                        '',
                        `Thanks for your interest in ${selectedSubmission.startupTitle || 'our startup'}.`,
                        selectedSubmission.investmentAmount ? `You indicated interest around ${selectedSubmission.investmentAmount}.` : '',
                        selectedSubmission.message ? `Your note: "${selectedSubmission.message}"` : '',
                        '',
                        'Would you be open to a quick chat to discuss further?',
                        '',
                        'Best regards,'
                      ].filter(Boolean).join('\n');

                      const modalBodyHtml = `
                        <p style=\"margin: 0 0 16px 0; color: #333333;\">Thanks for your interest in <strong>${selectedSubmission.startupTitle || 'our startup'}</strong>.</p>
                        ${selectedSubmission.investmentAmount ? `<p style=\\\"margin: 0 0 16px 0; color: #333333;\\\">You indicated interest around <strong>${selectedSubmission.investmentAmount}</strong>.</p>` : ''}
                        ${selectedSubmission.message ? `<blockquote style=\\\"margin: 12px 0; padding: 12px; background: #f9fafb; border-left: 4px solid #8b5cf6; color: #333333;\\\">${selectedSubmission.message}</blockquote>` : ''}
                        <p style=\"margin: 0 0 16px 0; color: #333333;\">Would you be open to a quick chat to discuss further?</p>
                      `;
                      const htmlBody = buildInterestedEmailHtml(
                        'Interested Users Manager',
                        greetingName,
                        modalBodyHtml,
                        { text: 'Schedule a Chat', href: (typeof window !== 'undefined' ? window.location.origin : 'https://foundrly.com') }
                      );

                      const res = await fetch('/api/interested-submissions/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ to: selectedSubmission.email, subject, body: textBody, html: htmlBody })
                      });
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err?.error || 'Failed to send email');
                      }
                    } catch (err) {
                      // optionally show toast
                    } finally {
                      setEmailSendingFor(null);
                    }
                  }}
                  className={`flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors ${emailSendingFor === selectedSubmission._id ? 'opacity-60 pointer-events-none' : ''}`}
                >
                  <Mail className="h-4 w-4" />
                  {emailSendingFor === selectedSubmission._id ? 'Sending…' : 'Send Email'}
                </button>
                {selectedSubmission.phone && (
                  <a
                    href={`tel:${selectedSubmission.phone}`}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    Call
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>,
        typeof window !== "undefined" && document.body ? document.body : document.createElement("div")
      )}

      <ChatController
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentUserId={userId}
        initialChatId={initialChatId}
      />
    </div>
  );
};

export default InterestedUsersManager;
