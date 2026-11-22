// Cliente mínimo do Gemini (Google) usado pelas funções novas de IA do Compras:
// respostas em JSON (texto). Chave: GEMINI_API_KEY. Modelo: GEMINI_MODEL.

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export function geminiKey(): string | null {
  const k = process.env.GEMINI_API_KEY?.trim()
  return k && k.length > 10 ? k : null
}

async function chamar(model: string, body: unknown, timeoutMs: number) {
  const key = geminiKey()
  if (!key) throw new Error('GEMINI_API_KEY não configurada.')
  const res = await fetch(`${BASE}/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`Gemini HTTP ${res.status}: ${txt.slice(0, 200)}`)
  }
  return res.json()
}

export async function geminiJson<T>(prompt: string, opts: { temperature?: number; timeoutMs?: number } = {}): Promise<T> {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const data = await chamar(
    model,
    {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: opts.temperature ?? 0.1, responseMimeType: 'application/json' },
    },
    opts.timeoutMs ?? 45_000
  )
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => p.text)?.text
  if (!text) throw new Error('Gemini não retornou texto.')
  const limpo = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '')
  return JSON.parse(limpo) as T
}

// Executa tarefas com no máximo `limite` em paralelo, preservando a ordem.
export async function emLotes<T, R>(itens: T[], limite: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const saida: R[] = new Array(itens.length)
  let proximo = 0
  async function trabalhador() {
    while (proximo < itens.length) {
      const i = proximo++
      saida[i] = await fn(itens[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limite, itens.length) }, trabalhador))
  return saida
}
