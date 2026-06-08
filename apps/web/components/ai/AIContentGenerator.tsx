'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import MarkdownIt from 'markdown-it';

interface GeneratedContent {
  title: string;
  description: string;
  category: string;
  tags: string[];
  pitch: string;
  marketAnalysis: string;
  features: string[];
  targetAudience: string[];
}

interface AIContentGeneratorProps {
  onContentGenerated?: (content: GeneratedContent) => void;
}

export default function AIContentGenerator({ onContentGenerated }: AIContentGeneratorProps) {
  const [idea, setIdea] = useState('');
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [generationMode, setGenerationMode] = useState<'idea' | 'existing'>('idea');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const generateContent = async () => {
    if (generationMode === 'idea' && !idea.trim()) {
      toast.error('Please provide a startup idea');
      return;
    }

    if (generationMode === 'existing' && (!title.trim() || !description.trim())) {
      toast.error('Please provide both title and description');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const requestBody = generationMode === 'existing' 
        ? {
            title: title.trim(),
            description: description.trim(),
            category: category.trim() || undefined
          }
        : {
            idea: idea.trim(),
            category: category.trim() || undefined
          };

      const response = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate content');
      }

      if (data.success) {
        setGeneratedContent(data.content);
        onContentGenerated?.(data.content);
        toast.success('Content generated successfully!');
      } else {
        throw new Error(data.message || 'Content generation failed');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate content');
      toast.error('Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const useContent = (field: string, value: string) => {
    if (field === 'description') {
      // This would typically update a parent component's state
      toast.success('Description applied!');
    } else if (field === 'category') {
      setCategory(value);
      toast.success('Category applied!');
    } else if (field === 'tags') {
      toast.success('Tags applied!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-semibold">AI Content Generator</h3>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>AI Content Generator</CardTitle>
          <CardDescription>
            Let AI help you create compelling content for your startup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Generation Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={generationMode === 'idea' ? 'default' : 'outline'}
              onClick={() => setGenerationMode('idea')}
              className="flex-1"
            >
              From Idea
            </Button>
            <Button
              variant={generationMode === 'existing' ? 'default' : 'outline'}
              onClick={() => setGenerationMode('existing')}
              className="flex-1"
            >
              From Title & Description
            </Button>
          </div>

          {generationMode === 'idea' ? (
            <>
              <div>
                <Label htmlFor="idea">Startup Idea *</Label>
                <Textarea
                  id="idea"
                  placeholder="Describe your startup idea in a few sentences..."
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="title">Startup Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter your startup name..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what your startup does..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </>
          )}
          
          <div>
            <Label htmlFor="category">Category (Optional)</Label>
            <Input
              id="category"
              placeholder="e.g., FinTech, HealthTech, EdTech..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <Button 
            onClick={generateContent} 
            disabled={isGenerating || (generationMode === 'idea' ? !idea.trim() : (!title.trim() || !description.trim()))}
            className="w-full flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Content...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Content
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <span className="font-medium">Generation Error</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {generatedContent && (
        <div className="space-y-4">
          {/* Generated Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Generated Description</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(generatedContent.description, 'description')}
                  >
                    {copiedField === 'description' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => useContent('description', generatedContent.description)}
                  >
                    Use This
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                {generatedContent.description}
              </p>
            </CardContent>
          </Card>

          {/* Suggested Category */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Suggested Category</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(generatedContent.category, 'category')}
                  >
                    {copiedField === 'category' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => useContent('category', generatedContent.category)}
                  >
                    Use This
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {generatedContent.category}
              </Badge>
            </CardContent>
          </Card>

          {/* Suggested Tags */}
          {generatedContent.tags && generatedContent.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Suggested Tags</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(generatedContent.tags.join(', '), 'tags')}
                    >
                      {copiedField === 'tags' ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => useContent('tags', generatedContent.tags.join(', '))}
                    >
                      Use These
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {generatedContent.tags?.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generated Title */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Generated Title</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(generatedContent.title, 'title')}
                  >
                    {copiedField === 'title' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => useContent('title', generatedContent.title)}
                  >
                    Use This
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="text-lg font-semibold text-gray-900">
                {generatedContent.title}
              </h3>
            </CardContent>
          </Card>

          {/* Generated Pitch */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Generated Pitch</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(generatedContent.pitch, 'pitch')}
                  >
                    {copiedField === 'pitch' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => useContent('pitch', generatedContent.pitch)}
                  >
                    Use This
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: new MarkdownIt().render(generatedContent.pitch) 
                }}
              />
            </CardContent>
          </Card>

          {/* Market Analysis */}
          {generatedContent.marketAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Market Analysis</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(generatedContent.marketAnalysis, 'marketAnalysis')}
                    >
                      {copiedField === 'marketAnalysis' ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => useContent('marketAnalysis', generatedContent.marketAnalysis)}
                    >
                      Use This
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {generatedContent.marketAnalysis}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Key Features */}
          {generatedContent.features && generatedContent.features.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Key Features</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(generatedContent.features.join('\n• '), 'features')}
                    >
                      {copiedField === 'features' ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => useContent('features', generatedContent.features.join('\n• '))}
                    >
                      Use These
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {generatedContent.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Target Audience */}
          {generatedContent.targetAudience && generatedContent.targetAudience.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Target Audience</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(generatedContent.targetAudience.join('\n• '), 'targetAudience')}
                    >
                      {copiedField === 'targetAudience' ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => useContent('targetAudience', generatedContent.targetAudience.join('\n• '))}
                    >
                      Use These
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {generatedContent.targetAudience.map((audience, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span className="text-gray-700">{audience}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

