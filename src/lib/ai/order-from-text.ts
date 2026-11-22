import { geminiJson } from './gemini-client'

export type ItemDaLista = {
  nome_material: string
  quantidade: number
  unidade: string | null
  observacoes: string | null
}

const PROMPT = `Você recebe uma lista de materiais de construção escrita por um engenheiro de obra
(pode ser mensagem de WhatsApp, ditado, abreviada, com erros de digitação).
Separe CADA material em um item. Responda só JSON:
{"itens":[{"nome_material":string,"quantidade":number,"unidade":string|null,"observacoes":string|null}]}
Regras:
- "nome_material": o material escrito de forma clara (corrija abreviações óbvias: "cim" → "cimento"), sem a quantidade.
- "quantidade": número (vírgula decimal vira ponto). Se não houver, use 1.
- "unidade": a unidade de compra (saco, m, m², m³, barra, un, rolo, lata, kg, caixa, par, milheiro...). null se não der para saber.
- "observacoes": detalhes que não são o nome (cor, local de aplicação, marca pedida, urgência). null se nada.
- Ignore saudações e textos que não são material. Não invente itens.

Lista:
`

// Lê um texto livre e devolve os itens do pedido (no máximo 80).
export async function lerListaDeMateriais(texto: string): Promise<ItemDaLista[]> {
  const r = await geminiJson<{ itens?: Partial<ItemDaLista>[] }>(PROMPT + texto.slice(0, 8000))
  return (r.itens ?? [])
    .filter((i) => typeof i.nome_material === 'string' && i.nome_material.trim().length >= 2)
    .slice(0, 80)
    .map((i) => ({
      nome_material: String(i.nome_material).trim().slice(0, 200),
      quantidade: Number(i.quantidade) > 0 ? Number(i.quantidade) : 1,
      unidade: i.unidade ? String(i.unidade).trim().slice(0, 30) : null,
      observacoes: i.observacoes ? String(i.observacoes).trim().slice(0, 500) : null,
    }))
}
