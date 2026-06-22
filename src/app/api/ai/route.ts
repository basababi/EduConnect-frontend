import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: body.system,
      messages: body.messages,
      stream: true,
    }),
  })

  if (!response.ok) {
    return new Response(
      JSON.stringify({ error: 'AI түр боломжгүй байна' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
}
