import { geminiJson } from './gemini-client'

type ItemRevisao = { nome: string; quantidade: number; unidade: string | null; materialId: string | null }

// Revisão do pedido inteiro antes da aprovação: duplicados (local) e
// quantidades/unidades estranhas ou especificação faltando (IA). Nunca lança.
export async function revisarPedido(itens: ItemRevisao[]): Promise<string[]> {
  const alertas: string[] = []

  const vistos = new Map<string, string>()
  for (const it of itens) {
    if (!it.materialId) continue
    const anterior = vistos.get(it.materialId)
    if (anterior) alertas.push(`"${it.nome}" aparece mais de uma vez no pedido (junto com "${anterior}"). Juntar em um item só?`)
    else vistos.set(it.materialId, it.nome)
  }

  try {
    const r = await geminiJson<{ alertas?: string[] }>(
      `Você revisa pedidos de compra de uma construtora brasileira antes da aprovação.
Aponte SÓ problemas reais, em frases curtas: quantidade fora do comum para obra (ex.: 5000 sacos de cimento,
0,5 barra), unidade que não combina com o material (ex.: cimento em metro), item sem informação essencial
para o fornecedor cotar (ex.: tubo sem diâmetro, tinta sem cor). Não comente itens corretos.
Responda JSON {"alertas": string[]} (lista vazia se estiver tudo certo; no máximo 6).
Itens: ${JSON.stringify(itens.map(({ nome, quantidade, unidade }) => ({ nome, quantidade, unidade })))}`,
      { timeoutMs: 30_000 }
    )
    for (const a of r.alertas ?? []) if (typeof a === 'string' && a.trim()) alertas.push(a.trim().slice(0, 240))
  } catch (error) {
    console.error('[IA revisão] falhou:', error instanceof Error ? error.message : error)
  }
  return alertas.slice(0, 10)
}
