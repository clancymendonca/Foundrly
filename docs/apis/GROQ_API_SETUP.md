# GROQ API Setup Guide

This guide explains how to set up GROQ API integration in your Foundrly application.

## What is GROQ?

GROQ is a fast inference platform that provides access to various open-source language models like Llama, Mixtral, and others. It's known for its speed and efficiency.

## Setup Instructions

### 1. Get a GROQ API Key

1. Visit the [GROQ Console](https://console.groq.com/)
2. Sign up or log in to your account
3. Navigate to the API Keys section
4. Generate a new API key
5. Copy the API key (it will look like `gsk_...`)

### 2. Add Environment Variable

Add the GROQ API key to your environment variables:

**For local development (.env.local):**
```bash
GROQ_API_KEY=gsk_your_api_key_here
```

**For production (Vercel/other platforms):**
Add `GROQ_API_KEY` to your environment variables in your deployment platform.

### 3. Available Models

The application will try these GROQ models in order of preference:

1. **llama-3.3-70b-versatile** - Latest Llama model with 70B parameters
2. **llama-3.1-70b-versatile** - Llama 3.1 with 70B parameters  
3. **llama-3.1-8b-instant** - Fast Llama 3.1 with 8B parameters
4. **mixtral-8x7b-32768** - Mixtral 8x7B model

### 4. How It Works

GROQ is integrated as a fallback option in the AI services chain:

**For Embeddings:**
1. Gemini (primary)
2. OpenAI (fallback)
3. Grok (fallback)
4. **GROQ (fallback)** ← New!
5. Hash-based embedding (final fallback)

**For Text Generation:**
1. Gemini (primary)
2. Claude (fallback)
3. Grok (fallback)
4. **GROQ (fallback)** ← New!

### 5. Rate Limiting

GROQ has its own rate limiting (5 calls per minute) to prevent excessive API usage and quota exhaustion.

### 6. Benefits

- **Speed**: GROQ is known for very fast inference
- **Cost-effective**: Often cheaper than other providers
- **Reliability**: Good uptime and availability
- **Open-source models**: Access to Llama, Mixtral, and other open models

### 7. Troubleshooting

**Common Issues:**

1. **API Key Not Set**: Make sure `GROQ_API_KEY` is properly set in your environment variables
2. **Rate Limits**: The application automatically handles rate limiting
3. **Model Availability**: If one model fails, it automatically tries the next one
4. **Network Issues**: GROQ API calls include retry logic

**Check Logs:**
Look for GROQ-related log messages in your console:
- `🤖 [GROQ EMBEDDING] Starting GROQ embedding generation...`
- `🤖 [GROQ TEXT GENERATION] Starting GROQ text generation...`
- `✅ [GROQ EMBEDDING] Successfully generated GROQ embedding...`

### 8. API Endpoints

GROQ uses OpenAI-compatible API endpoints:
- **Text Generation**: `https://api.groq.com/openai/v1/chat/completions`
- **Models**: Various Llama and Mixtral models

### 9. Pricing

GROQ offers competitive pricing. Check their [pricing page](https://console.groq.com/docs/pricing) for current rates.

---

**Note**: GROQ is now fully integrated into your Foundrly application as a fallback option. No additional code changes are needed once you set up the API key!
