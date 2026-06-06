'use client';

import { useEffect, useState } from 'react';
import ActivityGridItem from './ActivityGridItem';
import StartupCard from '@/components/startup/StartupCard';
import { client } from '@/sanity/lib/client';
import { USER_ACTIVITY_QUERY, TEST_REPORTS_QUERY, ALL_REPORTS_QUERY, STARTUP_IDS_FROM_REPORTS_QUERY, STARTUPS_BY_IDS_QUERY, USER_REPORTED_CONTENT_QUERY } from '@/sanity/lib/activity-queries';
import InlineSparkline from '@/components/analytics/InlineSparkline';
import AnalyticsPeriodSparkline from '@/components/analytics/AnalyticsPeriodSparkline';
import { ThumbsUp, ThumbsDown, Trash2, Reply } from 'lucide-react';

interface StartupData {
  _id: string;
  title: string;
  slug: { current: string };
  _createdAt: string;
  author: {
    _id: string;
    name: string;
    image?: string;
    bio?: string;
  };
  views: number;
  description: string;
  category: string;
  image?: string;
  likes: number;
  dislikes: number;
  commentsCount: number;
  activityType: string;
  userComments?: Array<{
    _id: string;
    text: string;
    createdAt: string;
    likes: number;
    dislikes: number;
  }>;
  userReports?: Array<{
    _id: string;
    reason: string;
    timestamp: string;
    status: string;
  }>;
}

interface CommentData {
  _id: string;
  text: string;
  createdAt: string;
  likes: number;
  dislikes: number;
  likedBy?: string[];
  dislikedBy?: string[];
  parentComment?: {
    _id: string;
    text: string;
    author?: {
      _id: string;
      name: string;
    };
  };
  startup: {
    _id: string;
    title: string;
    slug: { current: string };
    image?: string;
  } | null;
  author: {
    _id: string;
    name: string;
    image?: string;
  };
  userReports: Array<{
    _id: string;
    reason: string;
    timestamp: string;
    status: string;
  }>;
}

interface ReportedContentData {
  startups: StartupData[];
  comments: CommentData[];
}

interface ActivityContentGridProps {
  activityType: string;
  userId?: string;
  filters?: {
    sortBy: 'newest' | 'oldest';
    startDate?: {
      month: string;
      day: string;
      year: string;
    };
    endDate?: {
      month: string;
      day: string;
      year: string;
    };
  };
  onlyOwnStartups?: boolean;
  onStartupSelect?: (startupId: string) => void;
  selectedCategory?: string;
  showAnalytics?: boolean;
  onAnalyticsClick?: (startupId: string, title: string) => void;
}

const ActivityContentGrid = ({ activityType, userId, filters, onlyOwnStartups, onStartupSelect, selectedCategory, showAnalytics = false, onAnalyticsClick }: ActivityContentGridProps) => {
  const [startups, setStartups] = useState<StartupData[]>([]);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingComments, setLoadingComments] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchStartups = async () => {
      if (!userId) {
        setStartups([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Convert date filters to ISO strings if provided
        let startDate, endDate;
        if (filters?.startDate && filters?.endDate) {
          startDate = new Date(
            parseInt(filters.startDate.year),
            new Date(`${filters.startDate.month} 1, ${filters.startDate.year}`).getMonth(),
            parseInt(filters.startDate.day)
          ).toISOString();
          
          endDate = new Date(
            parseInt(filters.endDate.year),
            new Date(`${filters.endDate.month} 1, ${filters.endDate.year}`).getMonth(),
            parseInt(filters.endDate.day)
          ).toISOString();
        }

        let data;
        
        if (activityType === 'reviews') {
          // Use the new query for reports that handles both startups and comments
          data = await client.fetch(USER_REPORTED_CONTENT_QUERY, { userId });
        } else if (activityType === 'comments') {
          // Fetch user's authored comments and comments they interacted with (liked/disliked)
          const result = await client.fetch(`{
            "authored": *[_type == "comment" && author._ref == $userId && deleted != true] | order(_createdAt desc) {
              _id,
              text,
              _createdAt,
              likes,
              dislikes,
              likedBy,
              dislikedBy,
              "createdAt": _createdAt,
              startup -> { _id, title, slug, image },
              author -> { _id, name, image }
            },
            "interacted": *[_type == "comment" && deleted != true && ($userId in likedBy || $userId in dislikedBy)] | order(_createdAt desc) {
              _id,
              text,
              _createdAt,
              likes,
              dislikes,
              likedBy,
              dislikedBy,
              "createdAt": _createdAt,
              startup -> { _id, title, slug, image },
              author -> { _id, name, image }
            }
          }`, { userId });
          data = result;
        } else if (activityType === 'likes') {
          // Fetch startups the user has liked
          const query = USER_ACTIVITY_QUERY(activityType, startDate, endDate);
          const params = { userId, startDate, endDate };
          data = await client.fetch(query, params);
        } else if (activityType === 'dislikes') {
          // Use the existing query for dislikes (same as likes but for disliked content)
          const query = USER_ACTIVITY_QUERY(activityType, startDate, endDate);
          const params = { userId, startDate, endDate };
          data = await client.fetch(query, params);
        } else if (activityType === 'views') {
          // Fetch startups authored by the user, ordered by views desc
          data = await client.fetch(`
            *[_type == "startup" && author._ref == $userId] | order(views desc) {
              _id,
              title,
              slug,
              _createdAt,
              author -> { _id, name, image, bio },
              views,
              description,
              category,
              image,
              likes,
              dislikes,
              "commentsCount": count(comments),
              "activityType": "views"
            }
          `, { userId });
        } else if (activityType === 'likes' && onlyOwnStartups) {
          // Fetch startups authored by the user when showing analytics for own startups
          data = await client.fetch(`
            *[_type == "startup" && author._ref == $userId] | order(_createdAt desc) {
              _id,
              title,
              slug,
              _createdAt,
              author -> { _id, name, image, bio },
              views,
              description,
              category,
              image,
              likes,
              dislikes,
              "commentsCount": count(comments)
            }
          `, { userId });
        } else if (activityType === 'startup-selection') {
          // Explicit selection list: only show startups authored by the user
          const categoryFilter = selectedCategory && selectedCategory !== 'all' 
            ? `&& category == "${selectedCategory}"` 
            : '';
          
          data = await client.fetch(`
            *[_type == "startup" && author._ref == $userId ${categoryFilter}] | order(_createdAt desc) {
              _id,
              title,
              slug,
              _createdAt,
              author -> { _id, name, image, bio },
              views,
              description,
              category,
              image,
              likes,
              dislikes,
              "commentsCount": count(comments)
            }
          `, { userId });
        } else {
          // For engagement-audience tabs now representing categories, fetch own startups filtered by category
          const categoryFilter = activityType && activityType !== 'all' 
            ? `&& category == "${activityType}"` 
            : '';
          data = await client.fetch(`
            *[_type == "startup" && author._ref == $userId ${categoryFilter}] | order(_createdAt desc) {
              _id,
              title,
              slug,
              _createdAt,
              author -> { _id, name, image, bio },
              views,
              description,
              category,
              image,
              likes,
              dislikes,
              "commentsCount": count(comments)
            }
          `, { userId });
        }
        
        // Handle data based on activity type
        if (activityType === 'reviews') {
          // For reports, we have both startups and comments
          const reportedData = data as ReportedContentData;
          
          // Sort startups
          let sortedStartups = [...(reportedData.startups || [])];
          if (filters?.sortBy === 'oldest') {
            sortedStartups.sort((a, b) => new Date(a._createdAt).getTime() - new Date(b._createdAt).getTime());
          } else {
            sortedStartups.sort((a, b) => new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime());
          }
          
          // Sort comments
          let sortedComments = [...(reportedData.comments || [])];
          if (filters?.sortBy === 'oldest') {
            sortedComments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          } else {
            sortedComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          }
          
          setStartups(sortedStartups);
          setComments(sortedComments);
        } else if (activityType === 'comments') {
          // For comments, combine authored and interacted
          const authored = Array.isArray((data as any)?.authored) ? (data as any).authored : [];
          const interacted = Array.isArray((data as any)?.interacted) ? (data as any).interacted : [];
          const mergedMap = new Map<string, any>();
          [...authored, ...interacted].forEach((c: any) => {
            if (c && c._id) mergedMap.set(c._id, c);
          });
          let sortedData = Array.from(mergedMap.values());
          if (filters?.sortBy === 'oldest') {
            sortedData.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          } else {
            sortedData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          }

          setStartups([]);
          setComments(sortedData);
        } else if (activityType === 'likes') {
          // For likes, we only have startups
          let sortedData = [...data];
          if (filters?.sortBy === 'oldest') {
            sortedData.sort((a, b) => new Date(a._createdAt).getTime() - new Date(b._createdAt).getTime());
          } else {
            sortedData.sort((a, b) => new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime());
          }
          
          setStartups(sortedData);
          setComments([]);
        } else if (activityType === 'dislikes') {
          // For dislikes, we only have startups
          let sortedData = [...data];
          if (filters?.sortBy === 'oldest') {
            sortedData.sort((a, b) => new Date(a._createdAt).getTime() - new Date(b._createdAt).getTime());
          } else {
            sortedData.sort((a, b) => new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime());
          }
          
          setStartups(sortedData);
          setComments([]);
        } else if (activityType === 'views') {
          // For views, we only have startups
          let sortedData = [...data];
          if (filters?.sortBy === 'oldest') {
            sortedData.sort((a, b) => new Date(a._createdAt).getTime() - new Date(b._createdAt).getTime());
          } else {
            sortedData.sort((a, b) => new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime());
          }
          
          setStartups(sortedData);
          setComments([]);
        } else if (activityType === 'likes' && onlyOwnStartups) {
          // For likes, we only have startups
          let sortedData = [...data];
          if (filters?.sortBy === 'oldest') {
            sortedData.sort((a, b) => new Date(a._createdAt).getTime() - new Date(b._createdAt).getTime());
          } else {
            sortedData.sort((a, b) => new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime());
          }
          
          setStartups(sortedData);
          setComments([]);
        } else if (activityType === 'startup-selection') {
          // For selection, show user's own startups
          let sortedData = [...data];
          if (filters?.sortBy === 'oldest') {
            sortedData.sort((a, b) => new Date(a._createdAt).getTime() - new Date(b._createdAt).getTime());
          } else {
            sortedData.sort((a, b) => new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime());
          }

          setStartups(sortedData);
          setComments([]);
        } else {
          // For likes, we only have startups
          let sortedData = [...data];
          if (filters?.sortBy === 'oldest') {
            sortedData.sort((a, b) => new Date(a._createdAt).getTime() - new Date(b._createdAt).getTime());
          } else {
            sortedData.sort((a, b) => new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime());
          }
          
          setStartups(sortedData);
          setComments([]);
        }
      } catch (err) {
        setError('Failed to load activity data');
      } finally {
        setLoading(false);
      }
    };

    fetchStartups();
  }, [activityType, userId, filters, onlyOwnStartups, selectedCategory]);

  // Comment action handlers
  const handleCommentLike = async (commentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId || loadingComments.has(commentId)) return;
    setLoadingComments(prev => new Set(prev).add(commentId));
    try {
      const res = await fetch(`/api/comments/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, userId }),
      });
      if (res.ok) {
        // Fetch updated comment data
        const updatedComment = await client.fetch(`
          *[_type == "comment" && _id == $commentId][0]{
            _id, text, _createdAt, likes, dislikes, likedBy, dislikedBy, "createdAt": _createdAt,
            startup -> { _id, title, slug, image },
            author -> { _id, name, image }
          }
        `, { commentId });
        if (updatedComment) {
          setComments(prev => prev.map(comment => 
            comment._id === commentId ? updatedComment : comment
          ));
        }
      }
    } catch (err) {
      console.error('Error liking comment:', err);
    } finally {
      setLoadingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    }
  };

  const handleCommentDislike = async (commentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId || loadingComments.has(commentId)) return;
    setLoadingComments(prev => new Set(prev).add(commentId));
    try {
      const res = await fetch(`/api/comments/dislike`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, userId }),
      });
      if (res.ok) {
        // Fetch updated comment data
        const updatedComment = await client.fetch(`
          *[_type == "comment" && _id == $commentId][0]{
            _id, text, _createdAt, likes, dislikes, likedBy, dislikedBy, "createdAt": _createdAt,
            startup -> { _id, title, slug, image },
            author -> { _id, name, image }
          }
        `, { commentId });
        if (updatedComment) {
          setComments(prev => prev.map(comment => 
            comment._id === commentId ? updatedComment : comment
          ));
        }
      }
    } catch (err) {
      console.error('Error disliking comment:', err);
    } finally {
      setLoadingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    }
  };

  const handleCommentReply = (commentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Placeholder for reply functionality
    console.log('Reply to comment:', commentId);
  };

  const handleCommentDelete = async (commentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId || loadingComments.has(commentId)) return;
    if (!confirm('Are you sure you want to delete this comment?')) return;
    setLoadingComments(prev => new Set(prev).add(commentId));
    try {
      const res = await fetch(`/api/comments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      });
      if (res.ok) {
        setComments(prev => prev.filter(comment => comment._id !== commentId));
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
    } finally {
      setLoadingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="px-4 sm:pr-20">
        <ul className="card_grid-compact max-w-md mx-auto sm:max-w-none sm:mx-0">
          {Array.from({ length: 6 }).map((_, index) => (
            <li key={index}>
              <div className="startup-card_skeleton animate-pulse"></div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  if (activityType === 'reviews') {
    // For reports, check if we have any startups or comments
    if (startups.length === 0 && comments.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No reports found</p>
          <div className="mt-4 text-sm text-gray-400">
            <p>This tab shows content you have reported (startups and comments).</p>
            <p>To test this feature, try reporting some content first.</p>
          </div>
        </div>
      );
    }
  } else if (activityType === 'dislikes') {
    // For dislikes, check only startups
    if (startups.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No disliked content found</p>
        </div>
      );
    }
  } else if (activityType === 'views') {
    // For views, check only startups
    if (startups.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No startups found</p>
        </div>
      );
    }
  } else if (activityType === 'likes' && onlyOwnStartups) {
    // For likes, check only startups
    if (startups.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No {activityType} found</p>
        </div>
      );
    }
  } else if (activityType === 'comments') {
    if (comments.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No comments found</p>
          <p className="text-gray-400 text-sm mt-1">We show your comments and any you liked or disliked.</p>
        </div>
      );
    }
  } else {
    // For likes, check only startups
    if (startups.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No {activityType} found</p>
        </div>
      );
    }
  }

  return (
    <div className="px-4 sm:pr-20 pb-20">
      {/* Render comments for comments activity type */}
      {activityType === 'comments' && comments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-md mx-auto md:max-w-none">
          {comments.map((comment) => (
            <div key={comment._id} className="bg-white border-[5px] border-black rounded-[22px] p-4 shadow-200 hover:shadow-300 hover:border-primary transition-all duration-500">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {comment.author?.image ? (
                    <img 
                      src={comment.author.image} 
                      alt={comment.author?.name || 'User'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-600 font-medium text-sm">
                        {(comment.author?.name?.charAt(0) || '?').toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{comment.author?.name || 'User'}</h4>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-800 mb-3">{comment.text}</p>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={(e) => handleCommentLike(comment._id, e)}
                      disabled={loadingComments.has(comment._id)}
                      className="flex items-center gap-1 group disabled:opacity-50"
                    >
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                        comment.likedBy?.includes(userId || '') 
                          ? 'bg-green-100' 
                          : 'bg-gray-100 group-hover:bg-green-100'
                      }`}>
                        {loadingComments.has(comment._id) ? (
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin" />
                        ) : (
                          <ThumbsUp className={`size-4 transition-colors ${
                            comment.likedBy?.includes(userId || '') 
                              ? 'text-green-600' 
                              : 'text-gray-500 group-hover:text-green-600'
                          }`} />
                        )}
                      </div>
                      <span className={`text-sm font-medium ${
                        comment.likedBy?.includes(userId || '') 
                          ? 'text-green-600' 
                          : 'text-gray-700'
                      }`}>{comment.likes}</span>
                    </button>
                    
                    <button 
                      onClick={(e) => handleCommentDislike(comment._id, e)}
                      disabled={loadingComments.has(comment._id)}
                      className="flex items-center gap-1 group disabled:opacity-50"
                    >
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                        comment.dislikedBy?.includes(userId || '') 
                          ? 'bg-red-100' 
                          : 'bg-gray-100 group-hover:bg-red-100'
                      }`}>
                        {loadingComments.has(comment._id) ? (
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
                        ) : (
                          <ThumbsDown className={`size-4 transition-colors ${
                            comment.dislikedBy?.includes(userId || '') 
                              ? 'text-red-600' 
                              : 'text-gray-500 group-hover:text-red-600'
                          }`} />
                        )}
                      </div>
                      <span className={`text-sm font-medium ${
                        comment.dislikedBy?.includes(userId || '') 
                          ? 'text-red-600' 
                          : 'text-gray-700'
                      }`}>{comment.dislikes}</span>
                    </button>
                    <button 
                      onClick={(e) => handleCommentDelete(comment._id, e)}
                      disabled={loadingComments.has(comment._id)}
                      className="flex items-center gap-1 group disabled:opacity-50"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 group-hover:bg-red-100 transition-colors">
                        {loadingComments.has(comment._id) ? (
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="size-4 text-gray-500 group-hover:text-red-600 transition-colors" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700">Delete</span>
                    </button>
                  </div>
                  {comment.startup && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-blue-600 font-medium">{comment.startup.title}</span>
                      </div>
                      {comment.startup.image && (
                        <img 
                          src={comment.startup.image} 
                          alt={comment.startup.title}
                          className="w-16 h-16 rounded object-cover"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Render reported comments for reviews activity type */}
      {activityType === 'reviews' && comments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-md mx-auto md:max-w-none">
          {comments.map((comment) => (
            <div key={comment._id} className="bg-white border-[5px] border-black rounded-[22px] p-4 shadow-200 hover:shadow-300 hover:border-primary transition-all duration-500">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {comment.author?.image ? (
                    <img 
                      src={comment.author.image} 
                      alt={comment.author?.name || 'User'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-600 font-medium text-sm">
                        {(comment.author?.name?.charAt(0) || '?').toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{comment.author?.name || 'User'}</h4>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                    {comment.userReports?.[0]?.status && (
                      <span className="ml-auto inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300">
                        {comment.userReports[0].status}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-800 mb-3">{comment.text}</p>
                  {comment.startup && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-blue-600 font-medium">{comment.startup.title}</span>
                      </div>
                      {comment.startup.image && (
                        <img 
                          src={comment.startup.image} 
                          alt={comment.startup.title}
                          className="w-16 h-16 rounded object-cover"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Render startups for other activity types */}
      {activityType !== 'comments' && startups.length > 0 && activityType !== 'reviews' && (
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-md mx-auto md:max-w-none">
          {startups.map((startup) => (
            <StartupCard 
              key={startup._id}
              post={{
                ...startup,
                _createdAt: typeof startup._createdAt === 'string' ? startup._createdAt.replace(/^\s*[•.]+\s*/, "") : startup._createdAt
              } as any}
              isOwner={false}
              isLoggedIn={!!userId}
              userId={userId}
              showDescription={false}
              showCategory={false}
              showDetailsButton={false}
              analyticsContent={undefined}
              hideActions={showAnalytics || activityType === 'startup-selection'}
              hideViews={showAnalytics}
              analyticsRedirect={showAnalytics || activityType === 'startup-selection'}
              onAnalyticsClick={activityType === 'startup-selection' 
                ? (id) => onStartupSelect?.(id)
                : onAnalyticsClick}
            />
          ))}
        </ul>
      )}

      {/* Render reported startups for reviews with status */}
      {activityType === 'reviews' && startups.length > 0 && (
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-md mx-auto md:max-w-none">
          {startups.map((startup) => (
            <li key={startup._id} className="flex flex-col gap-2">
              {startup.userReports?.[0]?.status && (
                <span className="inline-flex self-start items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300">
                  {startup.userReports[0].status}
                </span>
              )}
              <StartupCard 
                key={startup._id}
                post={{
                  ...startup,
                  _createdAt: typeof startup._createdAt === 'string' ? startup._createdAt.replace(/^\s*[•.]+\s*/, "") : startup._createdAt
                } as any}
                isOwner={false}
                isLoggedIn={!!userId}
                userId={userId}
                showDescription={false}
                showCategory={false}
                showDetailsButton={false}
                analyticsContent={undefined}
                hideActions={false}
                hideImage={false}
                hideViews={false}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ActivityContentGrid;