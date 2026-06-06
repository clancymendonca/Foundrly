import { groqRateLimiter } from '@/lib/rate-limiter'
import type { RawModerationAnalysis } from '@/lib/moderation-settings-apply'

const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
]

const MODERATION_PROMPT = `You are a content moderation classifier for a startup community platform.
Analyze the user message and return ONLY valid JSON (no markdown fences) with this exact shape:
{
  "isFlagged": boolean,
  "severity": "low" | "medium" | "high" | "critical",
  "categories": string[],
  "primaryCategory": string,
  "reason": string,
  "confidence": number
}

Categories must use only these values when applicable: profanity, hateSpeech, threats, spam, personalInfo.
If content is clean, set isFlagged to false, severity to "low", categories to [], primaryCategory to "", reason to "", confidence to 0.
Be strict on hate speech, slurs, threats, harassment, and explicit profanity.`

function parseJsonResponse(text: string): RawModerationAnalysis {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  const parsed = JSON.parse(cleaned)

  return {
    isFlagged: Boolean(parsed.isFlagged),
    severity: typeof parsed.severity === 'string' ? parsed.severity : 'low',
    categories: Array.isArray(parsed.categories)
      ? parsed.categories.filter((c: unknown) => typeof c === 'string')
      : [],
    primaryCategory:
      typeof parsed.primaryCategory === 'string' ? parsed.primaryCategory : undefined,
    reason: typeof parsed.reason === 'string' ? parsed.reason : '',
    confidence:
      typeof parsed.confidence === 'number'
        ? Math.min(Math.max(parsed.confidence, 0), 1)
        : 0,
  }
}

export async function moderateWithGroq(
  text: string
): Promise<{ analysis: RawModerationAnalysis; model: string }> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured')
  }

  if (!groqRateLimiter.canMakeCall('groq-moderation')) {
    throw new Error('GROQ rate limit exceeded')
  }

  let lastError: Error | null = null

  for (const model of GROQ_MODELS) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: MODERATION_PROMPT },
            { role: 'user', content: `Message to moderate:\n${text}` },
          ],
          temperature: 0,
          max_tokens: 300,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`GROQ API error ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content

      if (!content || typeof content !== 'string') {
        throw new Error('Empty GROQ moderation response')
      }

      return { analysis: parseJsonResponse(content), model }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
    }
  }

  throw lastError ?? new Error('All GROQ models failed')
}
