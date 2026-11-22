import { geminiJson, emLotes } from './gemini-client'
import { ENRICHMENT_SYSTEM_PROMPT } from './providers/prompt'
import { normalizeEnrichmentOutput } from './providers/shared'
import { enrichMaterialWithAI } from './material-enrichment'
import type { MaterialEnrichmentInput, MaterialEnrichmentOutput } from '@/types/ai'

type Catalogo = NonNullable<MaterialEnrichmentInput['catalogo']>

// Padroniza o pedido inteiro numa chamada só (até 25 itens por chamada, em
// paralelo). Muito mais rápido que um item por vez. Se a chamada em lote
// falhar, cai para o modo antigo (item a item) para não travar o pedido.
export async function enriquecerEmLote(itens: MaterialEnrichmentInput[], catalogo: Catalogo): Promise<MaterialEnrichmentOutput[]> {
  const blocos: MaterialEnrichmentInput[][] = []
  for (let i = 0; i < itens.length; i += 25) blocos.push(itens.slice(i, i + 25))

  const resultados = await emLotes(blocos, 3, async (bloco) => {
    try {
      return await chamarLote(bloco, catalogo)
    } catch (error) {
      console.error('[IA lote] falhou, indo item a item:', error instanceof Error ? error.message : error)
      return Promise.all(bloco.map((it) => enrichMaterialWithAI({ ...it, catalogo })))
    }
  })
  return resultados.flat()
}

async function chamarLote(bloco: MaterialEnrichmentInput[], catalogo: Catalogo): Promise<MaterialEnrichmentOutput[]> {
  const catalogoTxt =
    catalogo.length > 0
      ? `Catálogo atual da Casa Forte (id | nome | unidade):\n${catalogo.map((c) => `${c.id} | ${c.nome} | ${c.unidade ?? '-'}`).join('\n')}\n
Se um material pedido for o MESMO produto de um item do catálogo (mesmo tipo e mesma medida/variação),
use "material_existente_id" com o id dele e o nome dele em "nome_padronizado". Se for diferente, null.\n`
      : ''
  const r = await geminiJson<{ itens?: (Partial<MaterialEnrichmentOutput> & { i?: number })[] }>(
    `${ENRICHMENT_SYSTEM_PROMPT}
${catalogoTxt}
Padronize CADA material abaixo. Responda só JSON:
{"itens":[{"i":number,"nome_padronizado":string,"categoria_sugerida":string,"unidade_sugerida":string,
"especificacao_melhorada":string,"observacao_fornecedor":string,"termos_busca_imagem":string[],
"alertas":string[],"confianca":number,"material_existente_id":string|null}]}
Um objeto por material, com "i" igual ao número do material.

Materiais:
${bloco.map((m, i) => `${i}: ${JSON.stringify({ nome_material: m.nome_material, quantidade: m.quantidade, unidade: m.unidade, descricao: m.descricao, observacoes: m.observacoes })}`).join('\n')}`,
    { timeoutMs: 60_000 }
  )
  const porIndice = new Map((r.itens ?? []).map((o) => [Number(o.i), o]))
  if (porIndice.size < bloco.length) throw new Error(`lote incompleto (${porIndice.size}/${bloco.length})`)
  return bloco.map((m, i) => normalizeEnrichmentOutput(porIndice.get(i) ?? {}, { ...m, catalogo }))
}
