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
    const detail = await response.text().catch(() => '')
    let message = 'AI түр боломжгүй байна. Дахин оролдоно уу.'
    try {
      const parsed = JSON.parse(detail)
      const m: string = parsed?.error?.message ?? ''
      if (/credit balance is too low/i.test(m)) {
        message = 'Anthropic дансны кредит дууссан байна. Plans & Billing хэсгээс кредит нэмнэ үү.'
      } else if (response.status === 401) {
        message = 'API түлхүүр буруу байна. .env.local дахь ANTHROPIC_API_KEY-г шалгана уу.'
      } else if (m) {
        message = m
      }
    } catch {
      // detail wasn't JSON
    }
    console.error('Anthropic API error', response.status, detail)
    return new Response(
      JSON.stringify({ error: message }),
      { status: response.status, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
}
