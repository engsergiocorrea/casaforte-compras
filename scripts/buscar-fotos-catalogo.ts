// Busca fotos reais (lojas BR) para os materiais do catálogo que estão sem foto.
// Respeita uma cota diária de buscas no Google (via Gemini): MAX_BUSCAS (padrão 450).
// Uso: npx tsx --tsconfig tsconfig.json scripts/buscar-fotos-catalogo.ts [arquivo-termos.json]
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { buscarFotoMaterial } from '@/lib/images/foto-web'
import { emLotes } from '@/lib/ai/gemini-client'

const MAX_BUSCAS = Number(process.env.MAX_BUSCAS || 450)
let buscas = 0
const fetchOriginal = globalThis.fetch
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
  if (url.includes('generativelanguage.googleapis.com')) {
    if (buscas >= MAX_BUSCAS) throw new Error('cota do dia atingida')
    buscas++
  }
  return fetchOriginal(input, init)
}) as typeof fetch

async function main() {
  const termos: Record<string, string> = process.argv[2] ? JSON.parse(fs.readFileSync(process.argv[2], 'utf8')) : {}
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
  const { data: mats } = await sb.from('materiais_catalogo').select('id, nome_padronizado, nome_normalizado, categoria_id, especificacao_padrao').eq('ativo', true).order('created_at')
  const { data: imgs } = await sb.from('material_images').select('material_catalogo_id').eq('principal', true).eq('aprovado', true).neq('origem', 'imagem_ilustrativa')
  const com = new Set((imgs ?? []).map((i) => i.material_catalogo_id))
  const pendentes = (mats ?? []).filter((m) => !com.has(m.id))
  console.log(`${new Date().toISOString()} sem foto: ${pendentes.length} | cota: ${MAX_BUSCAS} buscas`)
  let achadas = 0, falhas = 0
  await emLotes(pendentes, 3, async (m) => {
    if (buscas >= MAX_BUSCAS) return
    try {
      const termo = termos[m.nome_normalizado]
      const url = await buscarFotoMaterial({ materialCatalogoId: m.id, categoriaId: m.categoria_id, nome: m.nome_padronizado, termos: termo ? [termo] : [] })
      if (url) achadas++; else falhas++
    } catch { falhas++ }
    if ((achadas + falhas) % 25 === 0) console.log(`  ${achadas + falhas} processados · ${achadas} com foto · ${buscas} buscas`)
  })
  console.log(`${new Date().toISOString()} fim: ${achadas} fotos novas, ${falhas} sem foto, ${buscas} buscas usadas`)
}
main()
