'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, TrendingUp, AlertTriangle, Lightbulb, Target } from 'lucide-react';
import { toast } from 'sonner';
import { getPitchScoreTailwind, type PitchAnalysis } from '@foundrly/shared';

interface AIPitchAnalyzerProps {
  pitch: string;
  title: string;
  category?: string;
  onAnalysisComplete?: (analysis: PitchAnalysis) => void;
}

export default function AIPitchAnalyzer({ 
  pitch, 
  title, 
  category, 
  onAnalysisComplete 
}: AIPitchAnalyzerProps) {
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
          category
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

  const scoreStyle = analysis ? getPitchScoreTailwind(analysis.overallScore) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">AI Pitch Analysis</h3>
        </div>
        <Button 
          onClick={analyzePitch} 
          disabled={isAnalyzing || !pitch.trim() || !title.trim()}
          className="flex items-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4" />
              Analyze Pitch
            </>
          )}
        </Button>
      </div>

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
                <div className={`text-4xl font-bold ${scoreStyle?.textClass ?? ''}`}>
                  {analysis.overallScore}/10
                </div>
                <Badge className={scoreStyle?.badgeClass ?? ''}>
                  {scoreStyle?.label ?? 'Needs Improvement'}
                </Badge>
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

          {/* Missing Elements */}
          {analysis.missingElements && analysis.missingElements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="h-5 w-5" />
                  Missing Elements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.missingElements.map((element, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                      <span>{element}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Market Insights */}
          {(analysis.marketInsights.marketSize || analysis.marketInsights.competition || analysis.marketInsights.trends) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <TrendingUp className="h-5 w-5" />
                  Market Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.marketInsights.marketSize && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-600">Market Size</h4>
                    <p className="text-sm">{analysis.marketInsights.marketSize}</p>
                  </div>
                )}
                {analysis.marketInsights.competition && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-600">Competition</h4>
                    <p className="text-sm">{analysis.marketInsights.competition}</p>
                  </div>
                )}
                {analysis.marketInsights.trends && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-600">Trends</h4>
                    <p className="text-sm">{analysis.marketInsights.trends}</p>
                  </div>
                )}
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

