export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function streamAI(
  messages: Message[],
  systemPrompt: string,
  onChunk: (text: string) => void,
  onDone?: () => void
): Promise<void> {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, system: systemPrompt }),
  })

  if (!response.ok || !response.body) {
    onChunk('AI түр боломжгүй байна. Дахин оролдоно уу.')
    onDone?.()
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    const lines = chunk.split('\n')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim()
        if (data === '[DONE]') continue
        try {
          const parsed = JSON.parse(data)
          const text =
            parsed.delta?.text ||
            parsed.content?.[0]?.text ||
            ''
          if (text) onChunk(text)
        } catch {
          // SSE parsing errors are expected for non-JSON lines
        }
      }
    }
  }

  onDone?.()
}

export async function callAI(
  messages: Message[],
  systemPrompt: string
): Promise<string> {
  let result = ''
  await streamAI(messages, systemPrompt, (chunk) => {
    result += chunk
  })
  return result
}
