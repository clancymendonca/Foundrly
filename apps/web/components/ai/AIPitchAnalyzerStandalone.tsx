'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Brain, TrendingUp, AlertTriangle, Lightbulb, Target } from 'lucide-react';
import { toast } from 'sonner';

interface PitchAnalysis {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  marketInsights: string[];
  category: string;
  tags: string[];
  confidence: number;
}

interface AIPitchAnalyzerStandaloneProps {
  onAnalysisComplete?: (analysis: PitchAnalysis) => void;
}

export default function AIPitchAnalyzerStandalone({ 
  onAnalysisComplete 
}: AIPitchAnalyzerStandaloneProps) {
  const [title, setTitle] = useState('');
  const [pitch, setPitch] = useState('');
  const [category, setCategory] = useState('');
  const [analysis, setAnalysis] = useState<PitchAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzePitch = async () => {
    if (!pitch.trim() || !title.trim()) {
      toast.error('Please provide both title and pitch content');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/pitch-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pitch,
          title,
          category: category.trim() || undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to analyze pitch');
      }

      if (data.success) {
        setAnalysis(data.analysis);
        onAnalysisComplete?.(data.analysis);
        toast.success('Pitch analysis completed!');
      } else {
        throw new Error(data.message || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error analyzing pitch:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze pitch');
      toast.error('Failed to analyze pitch');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 8) return 'bg-green-100 text-green-800';
    if (score >= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">AI Pitch Analyzer</h3>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Analyze Your Startup Pitch</CardTitle>
          <CardDescription>
            Get AI-powered feedback on your startup pitch with detailed analysis and suggestions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Startup Title *</Label>
            <Input
              id="title"
              placeholder="Enter your startup title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="category">Category (Optional)</Label>
            <Input
              id="category"
              placeholder="e.g., FinTech, HealthTech, EdTech..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="pitch">Pitch Content *</Label>
            <Textarea
              id="pitch"
              placeholder="Describe your startup idea, problem, solution, market opportunity, and business model..."
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              className="min-h-[200px]"
            />
          </div>

          <Button 
            onClick={analyzePitch} 
            disabled={isAnalyzing || !pitch.trim() || !title.trim()}
            className="w-full flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing Pitch...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4" />
                Analyze Pitch
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Analysis Error</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {analysis && (
        <div className="space-y-4">
          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Overall Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className={`text-4xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                  {analysis.overallScore}/10
                </div>
                <Badge className={getScoreBadgeColor(analysis.overallScore)}>
                  {analysis.overallScore >= 8 ? 'Excellent' : 
                   analysis.overallScore >= 6 ? 'Good' : 'Needs Improvement'}
                </Badge>
                <div className="text-sm text-gray-600">
                  Confidence: {Math.round(analysis.confidence * 100)}%
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strengths */}
          {analysis.strengths && analysis.strengths.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Target className="h-5 w-5" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Weaknesses */}
          {analysis.weaknesses && analysis.weaknesses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Suggestions */}
          {analysis.suggestions && analysis.suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Lightbulb className="h-5 w-5" />
                  AI Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Market Insights */}
          {analysis.marketInsights && analysis.marketInsights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <TrendingUp className="h-5 w-5" />
                  Market Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.marketInsights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Category and Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                AI Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-medium text-sm text-gray-600 mb-2">Suggested Category</h4>
                <Badge variant="outline">{analysis.category}</Badge>
              </div>
              {analysis.tags && analysis.tags.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-2">Suggested Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
