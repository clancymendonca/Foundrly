# AI Features Guide

How to use Foundrly's AI-powered features, including pitch generation, analysis, recommendations, and moderation.

## Pitch Generator
- Instantly generate full startup pitches from your idea or description
 - Uses Gemini as primary, with fallbacks (Claude, Grok, GROQ) per `lib/ai-services.ts`

## Pitch Analysis
- Scoring, strengths/weaknesses, improvement suggestions, market insights

## Recommendations
- Personalized suggestions based on user behavior
 - Vector similarity via Pinecone; embeddings generated from comprehensive startup fields

## Content Moderation
- AI-powered analysis and flagging
 - Stream Chat moderation integrated via `lib/stream-chat-moderation.ts` and `app/api/chat/moderation/route.ts`


## AI-Driven Role-Based User Matching

### Overview
The `InterestedUsersManager.tsx` component provides an AI-driven interface for finding the most suitable users based on their role. It combines smart manual filters (search, status, role) with an AI matching system that analyzes user profiles and surfaces the best matches for a selected role.

### Filtering Logic
- **Search Filter:** Filters users by name, email, company, or startup title. Case-insensitive.
- **Status Filter:** Single-select dropdown to filter by user status (e.g., New, Contacted, Interested, etc.).
- **Role Filter:** Single-select dropdown to filter by user role (e.g., Investor, Founder, etc.). Only one role can be selected at a time, similar to the status filter.
- **Combined Filtering:** All filters are applied together. Only users matching all selected criteria are shown.

### AI Matching Logic
- **Trigger:** The AI matching is triggered by a button (or programmatically) and sends the currently filtered user profiles to the backend API (`/api/match-cofounder-investor`).
- **Backend:** The API uses Gemini/Claude/Grok/GROQ (via `lib/ai-services.ts`) to analyze profiles and return top matches.
- **Frontend:** The component parses the AI response and sets `topMatchedIds` state. If matches are found, only those users are shown in the table.
- **Fallback:** If parsing fails or no matches are returned, all filtered users are shown.

### Internal Notes Modal
- **Edit/Save/Cancel:** Internal notes for each user can be edited in a modal. Save updates the backend and UI; Cancel restores the previous notes.

### Error Handling
- All state is initialized at the top of the component to avoid ReferenceErrors.
- Duplicate state declarations are avoided.
- Errors from the AI API or backend are shown in the UI.

### Example Usage
1. Select a status and/or role from the dropdowns to filter users.
2. Enter a search term to further narrow results.
3. Trigger AI matching to see the most relevant users based on profile data.
4. Edit internal notes for any user via the modal.

---
For technical details, see `InterestedUsersManager.tsx` and `/api/match-cofounder-investor.ts`.

### Environment Variables
```env
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=...
GROK_API_KEY=...
GROQ_API_KEY=...
PINECONE_API_KEY=...
```
