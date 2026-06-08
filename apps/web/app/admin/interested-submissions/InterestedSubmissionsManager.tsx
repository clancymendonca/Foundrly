'use client';

import React, { useState, useMemo } from 'react';
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
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare
} from 'lucide-react';

interface InterestedSubmissionsManagerProps {
  initialSubmissions: InterestedSubmission[];
}

const InterestedSubmissionsManager: React.FC<InterestedSubmissionsManagerProps> = ({ 
  initialSubmissions 
}) => {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [selectedSubmission, setSelectedSubmission] = useState<InterestedSubmission | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');

  // Filter and search submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(submission => {
      const matchesSearch = 
        submission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.startupTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (submission.company && submission.company.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [submissions, searchTerm, statusFilter]);

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
        sub.name,
        sub.email,
        sub.phone || '',
        sub.company || '',
        sub.role || '',
        sub.startupTitle,
        sub.investmentAmount || '',
        sub.status || '',
        new Date(sub.submittedAt).toLocaleDateString()
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'in-discussion': return 'bg-purple-100 text-purple-800';
      case 'interested': return 'bg-green-100 text-green-800';
      case 'not-interested': return 'bg-red-100 text-red-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
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
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-80"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status ({submissions.length})</option>
              <option value="new">New ({statusStats.new})</option>
              <option value="contacted">Contacted ({statusStats.contacted})</option>
              <option value="in-discussion">In Discussion ({statusStats['in-discussion']})</option>
              <option value="interested">Interested ({statusStats.interested})</option>
              <option value="not-interested">Not Interested ({statusStats['not-interested']})</option>
              <option value="closed">Closed ({statusStats.closed})</option>
            </select>
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
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
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
                      {submission.startup?.author && (
                        <div className="text-xs text-gray-500">
                          by {submission.startup.author.name}
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
                    <select
                      value={submission.status || 'new'}
                      onChange={(e) => handleStatusUpdate(submission._id, e.target.value)}
                      className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getStatusColor(submission.status || 'new')}`}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="in-discussion">In Discussion</option>
                      <option value="interested">Interested</option>
                      <option value="not-interested">Not Interested</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(submission.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setNotes(submission.notes || '');
                          setShowModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <a
                        href={`mailto:${submission.email}`}
                        className="text-green-600 hover:text-green-900"
                        title="Send Email"
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                      {submission.phone && (
                        <a
                          href={`tel:${submission.phone}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Call"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(submission._id)}
                        className="text-red-600 hover:text-red-900"
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
            <div className="text-gray-400 text-lg mb-2">No submissions found</div>
            <div className="text-gray-500 text-sm">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Interested submissions will appear here'
              }
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedSubmission.name}</h2>
                  <p className="text-gray-600">Interested in: {selectedSubmission.startupTitle}</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
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
                    <div><strong>Submitted:</strong> {new Date(selectedSubmission.submittedAt).toLocaleString()}</div>
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
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
                {editingNotes ? (
                  <div className="space-y-2">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      placeholder="Add internal notes about this submission..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleNotesUpdate(selectedSubmission._id, notes)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Save Notes
                      </button>
                      <button
                        onClick={() => setEditingNotes(false)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-md min-h-[100px]">
                    {selectedSubmission.notes || 'No notes added yet. Click the edit button to add notes.'}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-4">
                <a
                  href={`mailto:${selectedSubmission.email}?subject=Re: Your interest in ${selectedSubmission.startupTitle}`}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Mail className="h-4 w-4" />
                  Send Email
                </a>
                {selectedSubmission.phone && (
                  <a
                    href={`tel:${selectedSubmission.phone}`}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Phone className="h-4 w-4" />
                    Call
                  </a>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterestedSubmissionsManager;
