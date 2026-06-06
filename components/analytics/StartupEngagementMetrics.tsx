"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, MessageCircle, Eye, Bookmark, UserPlus } from 'lucide-react';
import AnalyticsPeriodSparkline from './AnalyticsPeriodSparkline';

interface StartupEngagementMetricsProps {
  startupId: string;
  startupTitle: string;
  onBack: () => void;
}

interface EngagementData {
  likes: number;
  dislikes: number;
  comments: number;
  views: number;
  saved: number;
  interested: number;
}

export default function StartupEngagementMetrics({ startupId, startupTitle, onBack }: StartupEngagementMetricsProps) {
  const { data: session } = useSession();
  const [engagementData, setEngagementData] = useState<EngagementData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEngagementData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/startup-engagement/${startupId}`);
        if (response.ok) {
          const data = await response.json();
          setEngagementData(data);
        }
      } catch (error) {
        console.error('Error fetching engagement data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (startupId) {
      fetchEngagementData();
    }
  }, [startupId]);

  const metrics = [
    {
      label: 'Likes',
      value: engagementData?.likes || 0,
      icon: Heart,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      label: 'Dislikes',
      value: engagementData?.dislikes || 0,
      icon: Heart,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    },
    {
      label: 'Comments',
      value: engagementData?.comments || 0,
      icon: MessageCircle,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      label: 'Views',
      value: engagementData?.views || 0,
      icon: Eye,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      label: 'Saved',
      value: engagementData?.saved || 0,
      icon: Bookmark,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      label: 'Interested',
      value: engagementData?.interested || 0,
      icon: UserPlus,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  ];

  if (loading) {
    return (
      <div className="pr-20 h-full overflow-y-auto min-h-0 pb-16">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Loading engagement metrics...</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pr-20 h-full overflow-y-auto min-h-0 pb-16">

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric) => {
          const IconComponent = metric.icon;
          return (
            <div
              key={metric.label}
              className={`p-6 border-2 ${metric.borderColor} ${metric.bgColor} rounded-lg hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-full ${metric.bgColor} ${metric.borderColor} border`}>
                  <IconComponent className={`h-5 w-5 ${metric.color}`} />
                </div>
                <h3 className="font-semibold text-gray-900">{metric.label}</h3>
              </div>
              <div className={`text-3xl font-bold ${metric.color}`}>
                {metric.value.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trends (Sparklines) */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Likes</span>
              <span className="text-sm text-gray-500">last 30 days</span>
            </div>
            <AnalyticsPeriodSparkline
              startupId={startupId}
              currentValue={engagementData?.likes || 0}
              apiPath={'/api/analytics/likes'}
            />
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Dislikes</span>
              <span className="text-sm text-gray-500">last 30 days</span>
            </div>
            <AnalyticsPeriodSparkline
              startupId={startupId}
              currentValue={engagementData?.dislikes || 0}
              apiPath={'/api/analytics/dislikes'}
            />
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Comments</span>
              <span className="text-sm text-gray-500">last 30 days</span>
            </div>
            <AnalyticsPeriodSparkline
              startupId={startupId}
              currentValue={engagementData?.comments || 0}
              apiPath={'/api/analytics/comments'}
            />
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Views</span>
              <span className="text-sm text-gray-500">last 30 days</span>
            </div>
            <AnalyticsPeriodSparkline
              startupId={startupId}
              currentValue={engagementData?.views || 0}
              apiPath={'/api/analytics/views'}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Engagement Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Total Interactions:</span>
            <span className="ml-2">
              {(engagementData?.likes || 0) + (engagementData?.dislikes || 0) + (engagementData?.comments || 0)}
            </span>
          </div>
          <div>
            <span className="font-medium">Engagement Rate:</span>
            <span className="ml-2">
              {engagementData?.views ? 
                (((engagementData.likes + engagementData.dislikes + engagementData.comments) / engagementData.views) * 100).toFixed(2) + '%' 
                : '0%'
              }
            </span>
          </div>
          <div>
            <span className="font-medium">Interest Rate:</span>
            <span className="ml-2">
              {engagementData?.views ? 
                ((engagementData.interested / engagementData.views) * 100).toFixed(2) + '%' 
                : '0%'
              }
            </span>
          </div>
          <div>
            <span className="font-medium">Save Rate:</span>
            <span className="ml-2">
              {engagementData?.views ? 
                ((engagementData.saved / engagementData.views) * 100).toFixed(2) + '%' 
                : '0%'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
