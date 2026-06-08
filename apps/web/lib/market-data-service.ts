import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize AI service for market analysis
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface MarketData {
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
  marketInsights: {
    trends: string[];
    opportunities: string[];
    challenges: string[];
    keyPlayers: string[];
  };
  lastUpdated: string;
}

interface ExternalMarketData {
  category: string;
  marketSize: number;
  growthRate: number;
  competitionLevel: string;
  fundingTrends: {
    seed: number;
    seriesA: number;
    seriesB: number;
  };
  trends: string[];
  opportunities: string[];
  challenges: string[];
  keyPlayers: string[];
}

export class MarketDataService {
  private static cache = new Map<string, { data: MarketData; timestamp: number }>();
  private static CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  // Fetch market data from external APIs (mock implementation)
  private static async fetchExternalMarketData(category: string): Promise<ExternalMarketData | null> {
    try {
      // In a real implementation, you would integrate with APIs like:
      // - Crunchbase API for funding data
      // - AngelList API for startup data
      // - CB Insights API for market intelligence
      // - Statista API for market size data
      
      // For now, we'll use AI to generate realistic market data based on the category
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `Generate realistic market data for the "${category}" startup category. Consider that startups in this category often have detailed pitches covering business models, target markets, and value propositions. Include:

1. Market size in USD (realistic range for this category)
2. Growth rate as a percentage (0-50%)
3. Competition level (Low, Medium, High, Very High)
4. Typical funding amounts for seed, series A, and series B rounds
5. Current market trends (3-5 trends relevant to startups with detailed pitches)
6. Key opportunities (3-5 opportunities that align with common pitch themes)
7. Main challenges (3-5 challenges that startups in this space face)
8. Key players in the market (3-5 companies)

Format as JSON with fields: marketSize, growthRate, competitionLevel, fundingTrends (with seed, seriesA, seriesB), trends, opportunities, challenges, keyPlayers.

Make the data realistic and specific to the ${category} industry, considering that startups with comprehensive pitches tend to perform better in this market.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean and parse the response
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const marketData = JSON.parse(cleanedText);
      
      return {
        category,
        marketSize: marketData.marketSize || 1000000000,
        growthRate: marketData.growthRate || 0.15,
        competitionLevel: marketData.competitionLevel || 'Medium',
        fundingTrends: {
          seed: marketData.fundingTrends?.seed || 500000,
          seriesA: marketData.fundingTrends?.seriesA || 5000000,
          seriesB: marketData.fundingTrends?.seriesB || 20000000
        },
        trends: marketData.trends || ['Digital transformation', 'AI integration'],
        opportunities: marketData.opportunities || ['Market expansion', 'New technologies'],
        challenges: marketData.challenges || ['Competition', 'Regulation'],
        keyPlayers: marketData.keyPlayers || ['Industry leaders']
      };
    } catch (error) {
      console.error('Error fetching external market data:', error);
      return null;
    }
  }

  // Generate engagement benchmarks based on category and market data
  private static generateEngagementBenchmarks(category: string, marketData: ExternalMarketData): {
    avgViews: number;
    avgLikes: number;
    avgEngagement: number;
  } {
    // Base engagement rates by category
    const categoryMultipliers = {
      'Technology': { views: 1.2, likes: 1.1, engagement: 0.068 },
      'Healthcare': { views: 0.9, likes: 1.0, engagement: 0.073 },
      'Finance': { views: 1.1, likes: 1.0, engagement: 0.071 },
      'Education': { views: 0.8, likes: 0.9, engagement: 0.076 },
      'E-commerce': { views: 1.3, likes: 1.2, engagement: 0.068 },
      'SaaS': { views: 1.0, likes: 1.0, engagement: 0.070 },
      'Mobile': { views: 1.1, likes: 1.1, engagement: 0.069 },
      'AI/ML': { views: 1.4, likes: 1.3, engagement: 0.072 },
      'Blockchain': { views: 1.2, likes: 1.1, engagement: 0.065 },
      'IoT': { views: 0.9, likes: 0.9, engagement: 0.074 }
    };

    const multiplier = categoryMultipliers[category as keyof typeof categoryMultipliers] || categoryMultipliers['Technology'];
    
    // Adjust based on competition level
    const competitionAdjustment = {
      'Low': 1.2,
      'Medium': 1.0,
      'High': 0.8,
      'Very High': 0.6
    };

    const adjustment = competitionAdjustment[marketData.competitionLevel as keyof typeof competitionAdjustment] || 1.0;

    return {
      avgViews: Math.round(1000 * multiplier.views * adjustment),
      avgLikes: Math.round(70 * multiplier.likes * adjustment),
      avgEngagement: multiplier.engagement * adjustment
    };
  }

  // Get comprehensive market data for a category
  static async getMarketData(category: string): Promise<MarketData> {
    // Check cache first
    const cached = this.cache.get(category);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Fetch external market data
      const externalData = await this.fetchExternalMarketData(category);
      
      if (!externalData) {
        // Fallback to default data
        return this.getDefaultMarketData(category);
      }

      // Generate engagement benchmarks
      const engagementBenchmarks = this.generateEngagementBenchmarks(category, externalData);

      const marketData: MarketData = {
        category: externalData.category,
        avgViews: engagementBenchmarks.avgViews,
        avgLikes: engagementBenchmarks.avgLikes,
        avgEngagement: engagementBenchmarks.avgEngagement,
        marketSize: externalData.marketSize,
        growthRate: externalData.growthRate,
        competitionLevel: externalData.competitionLevel,
        fundingTrends: externalData.fundingTrends,
        marketInsights: {
          trends: externalData.trends,
          opportunities: externalData.opportunities,
          challenges: externalData.challenges,
          keyPlayers: externalData.keyPlayers
        },
        lastUpdated: new Date().toISOString()
      };

      // Cache the data
      this.cache.set(category, { data: marketData, timestamp: Date.now() });

      return marketData;
    } catch (error) {
      console.error('Error getting market data:', error);
      return this.getDefaultMarketData(category);
    }
  }

  // Get default market data as fallback
  private static getDefaultMarketData(category: string): MarketData {
    const defaultData = {
      'Technology': {
        avgViews: 1250,
        avgLikes: 85,
        avgEngagement: 0.068,
        marketSize: 5000000000,
        growthRate: 0.15,
        competitionLevel: 'High',
        fundingTrends: { seed: 500000, seriesA: 5000000, seriesB: 20000000 }
      },
      'Healthcare': {
        avgViews: 980,
        avgLikes: 72,
        avgEngagement: 0.073,
        marketSize: 3000000000,
        growthRate: 0.12,
        competitionLevel: 'Medium',
        fundingTrends: { seed: 750000, seriesA: 8000000, seriesB: 35000000 }
      },
      'Finance': {
        avgViews: 1100,
        avgLikes: 78,
        avgEngagement: 0.071,
        marketSize: 4000000000,
        growthRate: 0.18,
        competitionLevel: 'High',
        fundingTrends: { seed: 600000, seriesA: 6000000, seriesB: 25000000 }
      },
      'Education': {
        avgViews: 850,
        avgLikes: 65,
        avgEngagement: 0.076,
        marketSize: 2000000000,
        growthRate: 0.10,
        competitionLevel: 'Medium',
        fundingTrends: { seed: 400000, seriesA: 4000000, seriesB: 15000000 }
      },
      'E-commerce': {
        avgViews: 1400,
        avgLikes: 95,
        avgEngagement: 0.068,
        marketSize: 6000000000,
        growthRate: 0.20,
        competitionLevel: 'Very High',
        fundingTrends: { seed: 500000, seriesA: 5000000, seriesB: 20000000 }
      }
    };

    const data = defaultData[category as keyof typeof defaultData] || defaultData['Technology'];

    return {
      category,
      ...data,
      marketInsights: {
        trends: ['Digital transformation', 'AI integration', 'Remote work solutions'],
        opportunities: ['Market expansion', 'New technologies', 'Underserved segments'],
        challenges: ['Competition', 'Regulation', 'Market saturation'],
        keyPlayers: ['Industry leaders', 'Established companies', 'Emerging startups']
      },
      lastUpdated: new Date().toISOString()
    };
  }

  // Get market trends for multiple categories
  static async getMarketTrends(categories: string[]): Promise<Record<string, MarketData>> {
    const results: Record<string, MarketData> = {};
    
    // Fetch data for all categories in parallel
    const promises = categories.map(async (category) => {
      const data = await this.getMarketData(category);
      results[category] = data;
    });

    await Promise.all(promises);
    return results;
  }

  // Clear cache (useful for testing or manual refresh)
  static clearCache(): void {
    this.cache.clear();
  }

  // Get cache statistics
  static getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}
