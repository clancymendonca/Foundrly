import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { profiles } = await req.json();

    if (!profiles || !Array.isArray(profiles)) {
      return NextResponse.json({ error: 'Profiles array required' }, { status: 400 });
    }

    const prompt = `Match co-founders and investors based on their profiles. Return the best matches as JSON. Profiles: ${JSON.stringify(profiles)}`;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const matches = data.choices?.[0]?.message?.content || '';

    return NextResponse.json({ matches });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to match profiles', details: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
