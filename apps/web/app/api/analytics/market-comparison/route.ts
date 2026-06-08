import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'
import { aiService } from '@/lib/ai-services'
import { MarketDataService } from '@/lib/market-data-service'
import { Pinecone } from '@pinecone-database/pinecone'

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
})
const index = pinecone.index('foundrly-startups')

interface MarketBenchmark {
  category: string
  avgViews: number
  avgLikes: number
  avgEngagement: number
  marketSize: number
  growthRate: number
  competitionLevel: string
  fundingTrends: {
    seed: number
    seriesA: number
    seriesB: number
  }
}

interface SimilarStartup {
  _id: string
  title: string
  category: string
  views: number
  likes: number
  dislikes: number
  similarity: number
  author: { name: string }
}

interface ComparisonResult {
  yourStartup: {
    _id: string
    title: string
    category: string
    views: number
    likes: number
    dislikes: number
    engagement: number
    performance: {
      score: number
      strengths: string[]
      weaknesses: string[]
    }
  }
  marketBenchmark: MarketBenchmark
  similarStartups: SimilarStartup[]
  aiInsights: {
    marketPosition: string
    recommendations: string[]
    opportunities: string[]
    risks: string[]
    overallScore: number
  }
  charts: {
    engagementComparison: any[]
    growthTrends: any[]
    marketShare: any[]
  }
}

async function getMarketBenchmark(category: string): Promise<MarketBenchmark> {
  const marketData = await MarketDataService.getMarketData(category)
  return {
    category: marketData.category,
    avgViews: marketData.avgViews,
    avgLikes: marketData.avgLikes,
    avgEngagement: marketData.avgEngagement,
    marketSize: marketData.marketSize,
    growthRate: marketData.growthRate,
    competitionLevel: marketData.competitionLevel,
    fundingTrends: marketData.fundingTrends,
  }
}

async function findSimilarStartups(startupId: string, category: string, limit: number = 5): Promise<SimilarStartup[]> {
  try {
    const targetStartup = await client.fetch(
      `*[_type == "startup" && _id == $startupId][0] {
        _id,
        title,
        description,
        category,
        pitch,
        views,
        likes,
        dislikes
      }`,
      { startupId }
    )

    if (!targetStartup) return []

    const textContent = `${targetStartup.title ?? ''} ${targetStartup.description ?? ''} ${targetStartup.category ?? ''} ${targetStartup.pitch ? targetStartup.pitch.replace(/[#*`\[\]()]/g, '').substring(0, 200) : ''}`
    // Using private method via indexer to avoid changing aiService signature
    const embedding = await (aiService as any)['generateEmbedding'](textContent)

    const searchResults = await index.query({
      vector: embedding,
      topK: limit + 1,
      includeMetadata: true,
      filter: { category: { $eq: category } },
    })

    const similarIds = searchResults.matches
      ?.filter((m: any) => m.id !== startupId)
      .slice(0, limit)
      .map((m: any) => m.id) || []

    if (similarIds.length === 0) return []

    const similarStartups = await client.fetch(
      `*[_type == "startup" && _id in $similarIds] {
        _id,
        title,
        category,
        views,
        likes,
        dislikes,
        author->{name}
      }`,
      { similarIds }
    )

    return similarStartups
      .map((s: any) => {
        const match = searchResults.matches?.find((m: any) => m.id === s._id)
        return { ...s, similarity: match?.score || 0 }
      })
      .sort((a: SimilarStartup, b: SimilarStartup) => b.similarity - a.similarity)
  } catch (e) {
    console.error('similar startups error', e)
    return []
  }
}

async function generateAIInsights(
  yourStartup: any,
  marketBenchmark: MarketBenchmark,
  similarStartups: SimilarStartup[]
) {
  // Clean and truncate pitch content for analysis
  const pitchContent = yourStartup.pitch ? 
    yourStartup.pitch.replace(/[#*`\[\]()]/g, '').substring(0, 500) : 
    'No pitch provided';
  
  const prompt = `Analyze this startup's performance compared to market benchmarks and similar startups:\n\nYour Startup:\n- Title: ${yourStartup.title}\n- Category: ${yourStartup.category}\n- Description: ${yourStartup.description || 'No description'}\n- Pitch: ${pitchContent}\n- Views: ${yourStartup.views}\n- Likes: ${yourStartup.likes}\n- Engagement Rate: ${((yourStartup.likes / Math.max(1, yourStartup.views)) * 100).toFixed(2)}%\n\nMarket Benchmark (${yourStartup.category}):\n- Average Views: ${marketBenchmark.avgViews}\n- Average Likes: ${marketBenchmark.avgLikes}\n- Average Engagement: ${(marketBenchmark.avgEngagement * 100).toFixed(2)}%\n- Market Size: $${(marketBenchmark.marketSize / 1_000_000_000).toFixed(1)}B\n- Growth Rate: ${(marketBenchmark.growthRate * 100).toFixed(1)}%\n- Competition Level: ${marketBenchmark.competitionLevel}\n\nSimilar Startups in Foundrly:\n${similarStartups
    .map(
      (s) => `- ${s.title}: ${s.views} views, ${s.likes} likes, ${((s.likes / Math.max(1, s.views)) * 100).toFixed(2)}% engagement`
    )
    .join('\n')}\n\nBased on the startup's pitch, description, and performance metrics, provide a comprehensive analysis including:\n1. Market position (outperforming/underperforming/average)\n2. Top 3 recommendations for improvement based on the pitch content\n3. Key opportunities to capitalize on from the business model\n4. Potential risks to watch based on the market and pitch\n5. Overall performance score (1-10) considering both metrics and pitch quality\n\nFormat as JSON with fields: marketPosition, recommendations, opportunities, risks, overallScore.`

  try {
    const analysis = await (aiService as any)['generateText'](prompt, 1000)
    try {
      const parsed = JSON.parse(analysis)
      return {
        marketPosition: parsed.marketPosition || 'Average',
        recommendations: parsed.recommendations || ['Focus on engagement', 'Improve content quality'],
        opportunities: parsed.opportunities || ['Market growth potential'],
        risks: parsed.risks || ['Competition'],
        overallScore: parsed.overallScore || 7,
      }
    } catch {
      return {
        marketPosition: 'Average',
        recommendations: ['Focus on engagement', 'Improve content quality', 'Leverage market trends'],
        opportunities: ['Market growth potential', 'Underserved segments'],
        risks: ['Competition', 'Market saturation'],
        overallScore: 7,
      }
    }
  } catch (e) {
    console.error('ai insights error', e)
    return {
      marketPosition: 'Average',
      recommendations: ['Focus on engagement', 'Improve content quality'],
      opportunities: ['Market growth potential'],
      risks: ['Competition'],
      overallScore: 7,
    }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const startupId = searchParams.get('startupId')

  console.log('Market comparison API called with startupId:', startupId)
  console.log('Environment check - GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Set' : 'Missing')
  console.log('Environment check - PINECONE_API_KEY:', process.env.PINECONE_API_KEY ? 'Set' : 'Missing')

  if (!startupId) {
    return NextResponse.json({ success: false, message: 'Missing startupId parameter' }, { status: 400 })
  }

  try {
    const startup = await client.fetch(
      `*[_type == "startup" && _id == $startupId][0] {
        _id,
        title,
        category,
        description,
        pitch,
        views,
        likes,
        dislikes,
        author->{name}
      }`,
      { startupId }
    )

    if (!startup) {
      return NextResponse.json({ success: false, message: 'Startup not found' }, { status: 404 })
    }

    const engagement = startup.views > 0 ? startup.likes / startup.views : 0

    const marketBenchmark = await getMarketBenchmark(startup.category)
    const similarStartups = await findSimilarStartups(startupId, startup.category, 5)
    
    let aiInsights
    try {
      aiInsights = await generateAIInsights(startup, marketBenchmark, similarStartups)
    } catch (aiError) {
      console.error('AI insights failed, using fallback:', aiError)
      aiInsights = {
        marketPosition: 'Average',
        recommendations: ['Focus on engagement', 'Improve content quality'],
        opportunities: ['Market growth potential'],
        risks: ['Competition'],
        overallScore: 7
      }
    }

    const charts = {
      engagementComparison: [
        { name: 'Your Startup', value: engagement * 100, color: '#3B82F6' },
        { name: 'Market Average', value: marketBenchmark.avgEngagement * 100, color: '#10B981' },
        {
          name: 'Similar Startups',
          value:
            similarStartups.length > 0
              ? (similarStartups.reduce((sum, s) => sum + s.likes / Math.max(1, s.views), 0) / similarStartups.length) * 100
              : 0,
          color: '#F59E0B',
        },
      ],
      growthTrends: [
        { period: 'Week 1', your: 100, market: 100, similar: 100 },
        { period: 'Week 2', your: 120, market: 115, similar: 118 },
        { period: 'Week 3', your: 135, market: 130, similar: 132 },
        { period: 'Week 4', your: 150, market: 145, similar: 148 },
      ],
      marketShare: [
        {
          metric: 'Views',
          your: startup.views,
          market: marketBenchmark.avgViews,
          similar:
            similarStartups.length > 0
              ? Math.round(similarStartups.reduce((sum, s) => sum + s.views, 0) / similarStartups.length)
              : 0,
        },
        {
          metric: 'Likes',
          your: startup.likes,
          market: marketBenchmark.avgLikes,
          similar:
            similarStartups.length > 0
              ? Math.round(similarStartups.reduce((sum, s) => sum + s.likes, 0) / similarStartups.length)
              : 0,
        },
        {
          metric: 'Engagement',
          your: engagement * 100,
          market: marketBenchmark.avgEngagement * 100,
          similar:
            similarStartups.length > 0
              ? (similarStartups.reduce((sum, s) => sum + s.likes / Math.max(1, s.views), 0) / similarStartups.length) * 100
              : 0,
        },
      ],
    }

    const result: ComparisonResult = {
      yourStartup: {
        ...startup,
        engagement,
        performance: {
          score: aiInsights.overallScore,
          strengths: aiInsights.recommendations.slice(0, 2),
          weaknesses: aiInsights.risks.slice(0, 2),
        },
      },
      marketBenchmark,
      similarStartups,
      aiInsights,
      charts,
    }

    return NextResponse.json({ success: true, data: result })
  } catch (e) {
    console.error('market comparison error', e)
    return NextResponse.json({ success: false, message: 'Failed to generate market comparison' }, { status: 500 })
  }
}
