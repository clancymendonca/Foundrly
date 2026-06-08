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

/**
 * Parse and normalize a moderation JSON string into a RawModerationAnalysis.
 *
 * The function trims the input, removes common Markdown code-fence wrappers (``` or ```json),
 * parses the remaining text as JSON, and normalizes the resulting fields.
 *
 * @returns An object with the following normalized fields:
 * - `isFlagged`: boolean coerced from the parsed value
 * - `severity`: parsed string severity or `'low'` if missing/non-string
 * - `categories`: array of string categories (filtered to strings) or `[]`
 * - `primaryCategory`: parsed string or `undefined` if missing/non-string
 * - `reason`: parsed string or an empty string if missing/non-string
 * - `confidence`: numeric value clamped to the range `0`–`1`, or `0` if missing/non-number
 */
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

/**
 * Moderates the provided text with Groq chat models and returns the parsed moderation analysis along with the model that produced it.
 *
 * @param text - The message content to be moderated
 * @returns The normalization of the model's JSON response as `analysis`, and the `model` identifier that produced it
 * @throws Error('GROQ_API_KEY not configured') if the GROQ_API_KEY environment variable is missing
 * @throws Error('GROQ rate limit exceeded') if the Groq rate limiter disallows the call
 * @throws Error(`GROQ API error ${status}: ${body}`) if the Groq HTTP response is not OK
 * @throws Error('Empty GROQ moderation response') if the API response contains no moderation content
 * @throws The last encountered error if all configured GROQ models fail
 */
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
