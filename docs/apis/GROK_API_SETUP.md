# Grok API Setup Guide

## Overview

Grok API has been successfully integrated into your search functionality as an additional fallback option. This provides another AI service when Gemini and OpenAI are unavailable due to quota limits.

## Setup Instructions

### 1. Get Grok API Key

1. Visit [xAI Console](https://console.x.ai)
2. Sign up for an account or log in
3. Navigate to the API section
4. Generate a new API key
5. Copy the API key for use in your environment variables

### 2. Add Environment Variable

Add the following environment variable to your `.env.local` file:

```bash
GROK_API_KEY=your_grok_api_key_here
```

### 3. Restart Your Application

After adding the environment variable, restart your Next.js application:

```bash
npm run dev
# or
yarn dev
```

## How Grok Integration Works

### Embedding Generation
- **Primary**: Gemini API (embedding-001 model)
- **Fallback 1**: OpenAI API (text-embedding-3-small model)
- **Fallback 2**: Grok API (tries multiple models: grok-2-1212, grok-beta, grok-vision-beta, grok-2)
- **Fallback 3**: Hash-based embedding (mathematical fallback when all AI services fail)
- **Final Fallback**: Text search in Sanity

### Text Generation
- **Primary**: Gemini API (gemini-1.5-flash model)
- **Fallback 1**: Claude API (claude-3-haiku-20240307 model)
- **Fallback 2**: Grok API (tries multiple models: grok-2-1212, grok-beta, grok-vision-beta, grok-2)

### Grok Embedding Workaround

Since Grok doesn't have a dedicated embedding endpoint, the system uses multiple approaches:

#### AI-Based Approach (Primary)
1. Tries multiple Grok models in sequence: `grok-2-1212`, `grok-beta`, `grok-vision-beta`, `grok-2`
2. Sends a prompt to Grok asking it to generate a numerical vector representation
3. Grok returns a comma-separated list of numbers
4. The system parses these numbers into a 768-dimensional vector
5. Pads or truncates to match Pinecone index dimensions

#### Hash-Based Fallback (When AI Fails)
1. Creates a mathematical embedding using word hashing
2. Distributes word hashes across 768 dimensions
3. Normalizes the vector to unit length
4. Provides semantic similarity even without AI services

## Console Logs

The system includes comprehensive logging for Grok operations:

- `🤖 [GROK EMBEDDING]` - Grok embedding generation logs
- `🤖 [GROK TEXT GENERATION]` - Grok text generation logs
- `🔄 [GROK EMBEDDING]` - Grok fallback attempts
- `✅ [GROK EMBEDDING]` - Successful Grok operations
- `❌ [GROK EMBEDDING]` - Grok error logs
- `🔢 [HASH EMBEDDING]` - Hash-based embedding fallback logs
- `⚠️ [GROK EMBEDDING]` - Model-specific failure logs

## Testing

To test the Grok integration:

1. Ensure your Grok API key is set
2. Perform a search in your application
3. Check the console logs to see if Grok is being used
4. Look for the emoji-prefixed log messages

## Pricing

- **Grok API**: Check [xAI Pricing](https://x.ai/api) for current rates
- **Model Used**: `grok-beta` for both text generation and embedding workaround

## Troubleshooting

### Common Issues

1. **API Key Not Set**
   - Error: `GROK_API_KEY environment variable is not set`
   - Solution: Add the API key to your `.env.local` file

2. **Quota Exceeded**
   - Error: `429 Too Many Requests`
   - Solution: Check your xAI account billing and usage limits

3. **Invalid API Key**
   - Error: `401 Unauthorized`
   - Solution: Verify your API key is correct and active

### Debug Information

The system logs detailed information about:
- API key configuration status
- Request/response details
- Error types and messages
- Fallback chain execution

## Benefits

Adding Grok API provides:
- **Additional redundancy** when other AI services fail
- **Better uptime** for your search functionality
- **Cost distribution** across multiple AI providers
- **Improved reliability** with multiple fallback options
- **Multiple model support** - tries different Grok models automatically
- **Hash-based fallback** - works even when all AI services are down
- **Intelligent error handling** - automatically switches between models and methods

## Next Steps

1. Add your Grok API key to the environment variables
2. Test the search functionality
3. Monitor the console logs to verify Grok is working
4. Consider implementing caching to reduce API calls and costs
