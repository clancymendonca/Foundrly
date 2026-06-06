'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Carousel } from '@/components/ui/carousel';
import { Brain, TrendingUp, RefreshCw, Users, Target, ChevronLeft, ChevronRight } from 'lucide-react';
import { Filter } from 'lucide-react';
import { useAIRecommendations } from '@/hooks/ai/useAIRecommendations';
import StartupCard from '@/components/startup/StartupCard';
import RecommendedStartupCard from '@/components/startup/RecommendedStartupCard';
import { useEffect } from 'react';
import { client } from '@/sanity/lib/client';
import { STARTUP_BY_ID_QUERY } from '@/sanity/lib/queries';

interface AIRecommendationsProps {
  limit?: number;
  onStartupSelect?: (startup: any) => void;
  className?: string;
}

export default function AIRecommendations({ 
  limit = 6, 
  onStartupSelect, 
  className 
}: AIRecommendationsProps) {
  const { recommendations, isLoading, error, refetch } = useAIRecommendations(limit);
  const [mobileCurrentIndex, setMobileCurrentIndex] = useState(0);
  const [desktopCurrentIndex, setDesktopCurrentIndex] = useState(0);

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-3">
            <p className="text-30-semibold">Recommended Startups for you</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow p-6 animate-pulse">
              <div className="h-6 w-2/3 bg-gray-200 rounded mb-4" />
              <div className="h-4 w-1/2 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-1/3 bg-gray-200 rounded mb-2" />
              <div className="h-32 w-full bg-gray-100 rounded mb-4" />
              <div className="flex gap-2 mt-2">
                <div className="h-8 w-16 bg-gray-200 rounded" />
                <div className="h-8 w-16 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
      return (
        <div className={`space-y-4 ${className}`}>
          <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-3">
          <p className="text-30-semibold">Recommended Startups for you</p>
            </div>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={refetch} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
  }

  if (!recommendations || !recommendations.startups || recommendations.startups.length === 0) {
      return (
        <div className={`space-y-4 ${className}`}>
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-3">
              <p className="text-30-semibold">Recommended Startups for you</p>
            </div>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">No recommendations available</p>
                <p className="text-sm text-gray-400">
                  Start exploring startups to get personalized recommendations
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
  }

  return (
    <div className={`space-y-4 ${className}`}>



      {/* Recommended Startups Carousel - Mobile */}
      <div className="md:hidden">
        <div className="w-full max-w-6xl mx-auto">
          <Carousel
            itemsPerView={1}
            showDots={true}
            showArrows={false}
            autoPlay={false}
            externalControls={true}
            currentIndex={mobileCurrentIndex}
            onIndexChange={setMobileCurrentIndex}
            className="w-full"
          >
          {recommendations.startups?.map((startup, index) => (
            <RecommendedStartupCard
              key={startup._id || index}
              id={startup._id}
              similarity={startup.similarity}
              onStartupSelect={onStartupSelect}
            />
          ))}
          </Carousel>
        </div>
      </div>

      {/* Desktop Carousel */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-3">
            <p className="text-30-semibold">Recommended Startups for you</p>
            {recommendations?.reasons && recommendations.reasons.length > 0 && (
              <div className="hidden md:flex flex-wrap gap-2 ml-4">
                {recommendations.reasons.slice(0, 3).map((reason, idx) => (
                  <Badge key={idx} variant="secondary">{reason}</Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDesktopCurrentIndex(Math.max(0, desktopCurrentIndex - 1))}
              disabled={desktopCurrentIndex === 0}
              className="bg-white/90 hover:bg-white shadow-lg border-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDesktopCurrentIndex(Math.min(Math.max(0, (recommendations.startups?.length || 3) - 3), desktopCurrentIndex + 1))}
              disabled={desktopCurrentIndex >= Math.max(0, (recommendations.startups?.length || 3) - 3)}
              className="bg-white/90 hover:bg-white shadow-lg border-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="w-full max-w-8xl mx-auto">
          <Carousel
            itemsPerView={3}
            showDots={true}
            showArrows={false}
            autoPlay={false}
            externalControls={true}
            currentIndex={desktopCurrentIndex}
            onIndexChange={setDesktopCurrentIndex}
            className="w-full"
          >
            {recommendations.startups?.map((startup, index) => (
              <RecommendedStartupCard
                key={startup._id || index}
                id={startup._id}
                similarity={startup.similarity}
                onStartupSelect={onStartupSelect}
              />
            ))}
          </Carousel>
        </div>
      </div>

      {/* Footer */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            <span>
              Recommendations are personalized based on your interests and activity using AI
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

