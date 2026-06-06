# Startup Analytics System Guide

## Overview

The Startup Analytics System provides comprehensive market comparison and performance analysis for startups on the Foundrly platform. It compares your startups against market benchmarks and similar startups using AI-powered insights and interactive visualizations.

## Features

### 🎯 3-Way Comparison
- **Your Startup**: Performance metrics and analysis
- **Market Benchmarks**: Industry averages and trends
- **Similar Startups**: Foundrly startups in the same category

### 🤖 AI-Powered Insights
- Market position analysis
- Performance recommendations
- Opportunity identification
- Risk assessment
- Overall performance scoring

### 📊 Interactive Visualizations
- Engagement comparison charts
- Growth trend analysis
- Market share breakdown
- Performance radar charts
- Similar startup comparisons

## System Architecture

### APIs & Services Used
- **Gemini / Claude / Grok / GROQ**: AI insights via `lib/ai-services.ts`
- **Pinecone**: Vector similarity search for similar startups
- **External APIs**: Market data integration
- **Sanity CMS**: Startup data storage
- **Recharts**: Interactive data visualizations

### System Flow
```
User Request → Analytics Dashboard → Market Comparison API
                    ↓
            [Your Startup Data] + [Market Data] + [Similar Startups]
                    ↓
            AI Analysis (Gemini) + Vector Search (Pinecone)
                    ↓
            [Performance Score] + [Recommendations] + [Charts]
                    ↓
            Interactive Dashboard with 3-Way Comparison
```

### Data Flow
```
1. User selects startup for analysis
2. System fetches startup data from Sanity
3. Market data service fetches external benchmarks
4. Pinecone finds similar startups using vector similarity
5. AI analyzes performance and generates insights
6. Dashboard renders interactive charts and recommendations
```

### Key Components

#### 1. Market Comparison API (`/api/analytics/market-comparison`)
- Fetches comprehensive market data
- Finds similar startups using vector similarity
- Generates AI-powered insights
- Returns structured comparison data

#### 2. Market Data Service (`lib/market-data-service.ts`)
- Fetches real-time market data from external APIs
- Generates AI-powered market benchmarks
- Caches data for performance
- Provides fallback data

#### 3. Analytics Dashboard (`components/StartupAnalyticsDashboard.tsx`)
- Interactive charts and visualizations
- Tabbed interface for different views
- Real-time data updates
- Responsive design

#### 4. Analytics Integration (`components/AnalyticsMainContent.tsx`)
- Startup selection interface
- Dashboard integration
- Navigation between views

## Usage

### Accessing Analytics
1. Navigate to the Analytics section
2. Select "Startup Analytics" from the sidebar
3. Choose a startup to analyze
4. View comprehensive comparison data

### Understanding the Dashboard

#### Overview Tab
- Key performance metrics
- Engagement comparison charts
- Growth trend analysis

#### Comparison Tab
- Market share analysis
- Performance radar charts
- Detailed benchmarking

#### AI Insights Tab
- AI recommendations
- Market opportunities
- Risk assessment
- Market insights

#### Similar Startups Tab
- Foundrly startups in same category
- Similarity scores
- Performance comparisons

## API Endpoints

### Market Comparison
```
GET /api/analytics/market-comparison?startupId={id}
```
Returns comprehensive comparison data including:
- Your startup metrics
- Market benchmarks
- Similar startups
- AI insights
- Chart data

### Market Data
```
GET /api/analytics/market-data?category={category}
POST /api/analytics/market-data
```
Fetches market data for specific categories or multiple categories.

### Cache Management
```
GET /api/analytics/market-data?action=clear-cache
GET /api/analytics/market-data?action=cache-stats
```
Manages market data cache.

## Data Sources

### Internal Data (Foundrly)
- Startup profiles and metrics
- User engagement data
- Category classifications
- Performance history

### External Data (AI-Generated)
- Market size and growth rates
- Competition levels
- Funding trends
- Industry insights

### Similarity Matching
- Vector embeddings using Gemini AI
- Pinecone vector database
- Semantic similarity scoring
- Category-based filtering

## Performance Metrics

### Engagement Metrics
- Views per startup
- Likes and dislikes
- Engagement rate (likes/views)
- Growth trends

### Market Metrics
- Market size and growth
- Competition level
- Funding benchmarks
- Industry trends

### AI Analysis
- Overall performance score (1-10)
- Market position assessment
- Strengths and weaknesses
- Recommendations

## Customization

### Adding New Categories
1. Update category mappings in `market-data-service.ts`
2. Add category-specific multipliers
3. Update AI prompts for better analysis

### Extending Market Data
1. Integrate additional external APIs
2. Update the `fetchExternalMarketData` method
3. Add new data fields to interfaces

### Custom Visualizations
1. Add new chart types in `StartupAnalyticsDashboard.tsx`
2. Create new data processing functions
3. Update the tabs interface

## Configuration

### Environment Variables
```env
GEMINI_API_KEY=your_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
NEXT_PUBLIC_SANITY_PROJECT_ID=your_sanity_project_id
NEXT_PUBLIC_SANITY_DATASET=your_sanity_dataset
SANITY_API_TOKEN=your_sanity_token
ANTHROPIC_API_KEY=your_claude_api_key
GROK_API_KEY=your_grok_api_key
GROQ_API_KEY=your_groq_api_key
```

### Dependencies
```json
{
  "recharts": "^2.8.0",
  "@radix-ui/react-tabs": "^1.0.0",
  "@google/generative-ai": "^0.24.1",
  "@pinecone-database/pinecone": "^6.1.2"
}
```

## Troubleshooting

### Common Issues

#### No Similar Startups Found
- Check if startups exist in the same category
- Verify Pinecone index is populated
- Ensure vector embeddings are generated

#### Market Data Not Loading
- Check API keys are configured
- Verify external API connectivity
- Check cache status

#### Charts Not Rendering
- Ensure Recharts is installed
- Check data format matches chart expectations
- Verify responsive container setup

### Debugging
1. Check browser console for errors
2. Verify API responses in Network tab
3. Check server logs for backend issues
4. Use cache stats endpoint to verify data

## Future Enhancements

### Planned Features
- Real-time market data from external APIs
- Historical performance tracking
- Predictive analytics
- Custom benchmark creation
- Export functionality
- Advanced filtering options

### Integration Opportunities
- Crunchbase API for funding data
- AngelList API for startup data
- CB Insights API for market intelligence
- Statista API for market size data
- Google Trends API for trend analysis

## Support

For issues or questions about the Startup Analytics System:
1. Check this documentation
2. Review the troubleshooting section
3. Check server logs for errors
4. Verify API configurations

## Contributing

When contributing to the analytics system:
1. Follow the existing code structure
2. Add proper TypeScript types
3. Include error handling
4. Update documentation
5. Test with various data scenarios
