'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  Eye, 
  Heart, 
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';

interface MarketBenchmark {
  category: string;
  avgViews: number;
  avgLikes: number;
  avgEngagement: number;
  marketSize: number;
  growthRate: number;
  competitionLevel: string;
  fundingTrends: {
    seed: number;
    seriesA: number;
    seriesB: number;
  };
}

interface SimilarStartup {
  _id: string;
  title: string;
  category: string;
  views: number;
  likes: number;
  dislikes: number;
  similarity: number;
  author: {
    name: string;
  };
}

interface AIInsights {
  marketPosition: string;
  recommendations: string[];
  opportunities: string[];
  risks: string[];
  overallScore: number;
}

interface ComparisonData {
  yourStartup: {
    _id: string;
    title: string;
    category: string;
    description?: string;
    pitch?: string;
    views: number;
    likes: number;
    dislikes: number;
    engagement: number;
    performance: {
      score: number;
      strengths: string[];
      weaknesses: string[];
    };
  };
  marketBenchmark: MarketBenchmark;
  similarStartups: SimilarStartup[];
  aiInsights: AIInsights;
  charts: {
    engagementComparison: any[];
    growthTrends: any[];
    marketShare: any[];
  };
}

interface StartupAnalyticsDashboardProps {
  startupId: string;
  startupTitle?: string;
}

const COLORS = {
  your: '#3B82F6',
  market: '#10B981', 
  similar: '#F59E0B',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444'
};

export default function StartupAnalyticsDashboard({ startupId, startupTitle }: StartupAnalyticsDashboardProps) {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchComparisonData();
  }, [startupId]);

  const fetchComparisonData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching analytics for startup:', startupId);
      const response = await fetch(`/api/analytics/market-comparison?startupId=${startupId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Analytics API response:', result);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch comparison data');
      }
      
      setData(result.data);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 8) return COLORS.success;
    if (score >= 6) return COLORS.warning;
    return COLORS.danger;
  };

  const getPerformanceLabel = (score: number) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Average';
    return 'Needs Improvement';
  };

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined || isNaN(num)) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercentage = (num: number | null | undefined) => {
    if (num === null || num === undefined || isNaN(num)) return '0.0%';
    return `${num.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Analytics</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchComparisonData} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const { yourStartup, marketBenchmark, similarStartups, aiInsights, charts } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {startupTitle || yourStartup.title} Analytics
          </h2>
          <p className="text-gray-600">Market comparison and performance insights</p>
        </div>
        <Badge 
          variant="outline" 
          className={`px-3 py-1 ${getPerformanceColor(aiInsights.overallScore)}`}
        >
          {getPerformanceLabel(aiInsights.overallScore)} ({aiInsights.overallScore}/10)
        </Badge>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Views</p>
                <p className="text-2xl font-bold">{formatNumber(yourStartup.views || 0)}</p>
                <p className="text-xs text-gray-500">
                  vs {formatNumber(marketBenchmark.avgViews || 0)} market avg
                </p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Likes</p>
                <p className="text-2xl font-bold">{formatNumber(yourStartup.likes || 0)}</p>
                <p className="text-xs text-gray-500">
                  vs {formatNumber(marketBenchmark.avgLikes || 0)} market avg
                </p>
              </div>
              <Heart className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Engagement</p>
                <p className="text-2xl font-bold">{formatPercentage((yourStartup.engagement || 0) * 100)}</p>
                <p className="text-xs text-gray-500">
                  vs {formatPercentage((marketBenchmark.avgEngagement || 0) * 100)} market avg
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Market Position</p>
                <p className="text-lg font-bold capitalize">{aiInsights.marketPosition}</p>
                <p className="text-xs text-gray-500">
                  {marketBenchmark.competitionLevel} competition
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="similar">Similar Startups</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Engagement Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Engagement Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={charts.engagementComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                  <Legend />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Growth Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Growth Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={charts.growthTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="your" stroke={COLORS.your} strokeWidth={2} name="Your Startup" />
                  <Line type="monotone" dataKey="market" stroke={COLORS.market} strokeWidth={2} name="Market Average" />
                  <Line type="monotone" dataKey="similar" stroke={COLORS.similar} strokeWidth={2} name="Similar Startups" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          {/* Market Share Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Market Share Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={charts.marketShare} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="metric" type="category" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="your" fill={COLORS.your} name="Your Startup" />
                  <Bar dataKey="market" fill={COLORS.market} name="Market Average" />
                  <Bar dataKey="similar" fill={COLORS.similar} name="Similar Startups" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Performance Radar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={[
                  {
                    metric: 'Views',
                    your: Math.min((yourStartup.views / marketBenchmark.avgViews) * 100, 200),
                    market: 100,
                    similar: similarStartups.length > 0 ? 
                      Math.min((similarStartups.reduce((sum, s) => sum + s.views, 0) / similarStartups.length / marketBenchmark.avgViews) * 100, 200) : 0
                  },
                  {
                    metric: 'Engagement',
                    your: Math.min((yourStartup.engagement / marketBenchmark.avgEngagement) * 100, 200),
                    market: 100,
                    similar: similarStartups.length > 0 ? 
                      Math.min((similarStartups.reduce((sum, s) => sum + (s.likes / s.views), 0) / similarStartups.length / marketBenchmark.avgEngagement) * 100, 200) : 0
                  },
                  {
                    metric: 'Growth',
                    your: 120,
                    market: 100,
                    similar: 115
                  },
                  {
                    metric: 'Market Fit',
                    your: aiInsights.overallScore * 10,
                    market: 70,
                    similar: 75
                  }
                ]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={90} domain={[0, 200]} />
                  <Radar name="Your Startup" dataKey="your" stroke={COLORS.your} fill={COLORS.your} fillOpacity={0.3} />
                  <Radar name="Market Average" dataKey="market" stroke={COLORS.market} fill={COLORS.market} fillOpacity={0.3} />
                  <Radar name="Similar Startups" dataKey="similar" stroke={COLORS.similar} fill={COLORS.similar} fillOpacity={0.3} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {aiInsights.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{recommendation}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {aiInsights.opportunities.map((opportunity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <Target className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{opportunity}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Risks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Risks to Watch
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {aiInsights.risks.map((risk, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{risk}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Market Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Market Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Market Size</span>
                  <span className="font-semibold">${(marketBenchmark.marketSize / 1000000000).toFixed(1)}B</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Growth Rate</span>
                  <span className="font-semibold">{formatPercentage(marketBenchmark.growthRate * 100)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Competition Level</span>
                  <Badge variant="outline">{marketBenchmark.competitionLevel}</Badge>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600 mb-2">Funding Trends</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Seed: ${formatNumber(marketBenchmark.fundingTrends.seed)}</span>
                      <span>Series A: ${formatNumber(marketBenchmark.fundingTrends.seriesA)}</span>
                      <span>Series B: ${formatNumber(marketBenchmark.fundingTrends.seriesB)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        <TabsContent value="similar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Similar Startups in Foundrly
              </CardTitle>
            </CardHeader>
            <CardContent>
              {similarStartups.length > 0 ? (
                <div className="space-y-4">
                  {similarStartups.map((startup) => (
                    <div key={startup._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{startup.title}</h4>
                        <p className="text-sm text-gray-600">by {startup.author.name}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {formatNumber(startup.views)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {formatNumber(startup.likes)}
                          </span>
                          <span>
                            {formatPercentage((startup.likes / startup.views) * 100)} engagement
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-2">
                          {formatPercentage(startup.similarity * 100)} similar
                        </Badge>
                        <p className="text-xs text-gray-500">{startup.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No similar startups found in this category</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
