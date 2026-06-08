'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Brain, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';
import StartupCard from '@/components/startup/StartupCard';

interface SearchResult {
  startups: any[];
  confidence: number;
  suggestions: string[];
  relatedCategories: string[];
}

interface AISemanticSearchProps {
  onStartupSelect?: (startup: any) => void;
  className?: string;
}

export default function AISemanticSearch({ onStartupSelect, className }: AISemanticSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('foundrly-search-history');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading search history:', error);
      }
    }
  }, []);

  // Save search history to localStorage
  const saveToHistory = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    const newHistory = [searchTerm, ...searchHistory.filter(term => term !== searchTerm)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('foundrly-search-history', JSON.stringify(newHistory));
  };

  const logSearch = async (term: string) => {
    try {
      await fetch('/api/search/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term }),
      });
    } catch (e) {
      // Non-blocking; ignore logging failures
    }
  };

  const performSearch = async (searchQuery: string) => {
    console.log('🔍 [FRONTEND SEARCH] Starting search:', { searchQuery });
    
    if (!searchQuery.trim()) {
      console.log('❌ [FRONTEND SEARCH] Empty search query provided');
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      console.log('🌐 [FRONTEND SEARCH] Making API request to semantic search...');
      const response = await fetch(`/api/ai/semantic-search?q=${encodeURIComponent(searchQuery)}&limit=12`);
      const data = await response.json();

      console.log('🌐 [FRONTEND SEARCH] API response received:', {
        status: response.status,
        ok: response.ok,
        success: data.success,
        resultsCount: data.results?.startups?.length || 0,
        fallbackUsed: data.results?.fallbackUsed || false,
        confidence: data.results?.confidence || 0
      });

      if (!response.ok) {
        console.error('❌ [FRONTEND SEARCH] API request failed:', {
          status: response.status,
          message: data.message
        });
        throw new Error(data.message || 'Search failed');
      }

      if (data.success) {
        // The API returns results as an object with startups, reasons, and confidence
        const apiResults = data.results;
        const searchResults: SearchResult = {
          startups: apiResults?.startups || [],
          confidence: apiResults?.confidence || 0.85,
          suggestions: [
            'Try searching for "AI startups"',
            'Look for "fintech companies"',
            'Search "healthcare technology"'
          ],
          relatedCategories: Array.from(new Set((apiResults?.startups || []).map((startup: any) => startup.category).filter(Boolean)))
        };
        
        console.log('✅ [FRONTEND SEARCH] Search results processed:', {
          startupsCount: searchResults.startups.length,
          confidence: searchResults.confidence,
          relatedCategories: searchResults.relatedCategories
        });
        
        setResults(searchResults);
        saveToHistory(searchQuery);
        logSearch(searchQuery);
        
        // Show detailed toast with error information if fallback was used
        if (apiResults?.fallbackUsed && apiResults?.toastMessage) {
          console.log('⚠️ [FRONTEND SEARCH] Fallback was used:', apiResults.toastMessage);
          toast.success(`Found ${apiResults?.startups?.length || 0} results (${apiResults.toastMessage})`);
        } else {
          console.log('✅ [FRONTEND SEARCH] Normal AI search completed successfully');
          toast.success(`Found ${apiResults?.startups?.length || 0} results`);
        }
      } else {
        console.error('❌ [FRONTEND SEARCH] API returned success: false:', data.message);
        throw new Error(data.message || 'Search failed');
      }
    } catch (error) {
      console.error('❌ [FRONTEND SEARCH] Search error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.constructor.name : typeof error
      });
      setError(error instanceof Error ? error.message : 'Search failed');
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
      console.log('🔍 [FRONTEND SEARCH] Search completed, isSearching set to false');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    performSearch(suggestion);
  };

  const handleHistoryClick = (term: string) => {
    setQuery(term);
    performSearch(term);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Header */}
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">AI-Powered Search</h3>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Find Startups with AI</CardTitle>
          <CardDescription>
            Search using natural language - describe what you're looking for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., 'AI startups for healthcare' or 'fintech apps for small businesses'"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={isSearching || !query.trim()}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>

          {/* Search History */}
          {searchHistory.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Recent searches:</p>
              <div className="flex flex-wrap gap-2">
                {searchHistory.slice(0, 5).map((term, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant="outline"
                    onClick={() => handleHistoryClick(term)}
                    className="text-xs"
                  >
                    {term}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <span className="font-medium">Search Error</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {results && (
        <div className="space-y-4">
          {/* Search Results Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">
                      Found {results.startups?.length || 0} startups
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-600">
                      {Math.round((results.confidence || 0) * 100)}% confidence
                    </span>
                  </div>
                </div>
                {results.relatedCategories && results.relatedCategories.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-gray-600">Related categories:</span>
                    <div className="flex gap-1">
                      {results.relatedCategories.slice(0, 3).map((category, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Search Suggestions */}
          {results.suggestions && results.suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Try these searches:</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {results.suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant="outline"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Results */}
          {results.startups && results.startups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.startups?.map((startup, index) => (
                <div key={startup._id || index} className="relative">
                  <StartupCard 
                    post={startup} 
                    isLoggedIn={true} 
                    userId={null}
                    onStartupSelect={onStartupSelect}
                  />
                  {startup.similarity && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(startup.similarity * 100)}% match
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-500">No startups found matching your search.</p>
                <p className="text-sm text-gray-400 mt-1">
                  Try different keywords or browse our categories.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

