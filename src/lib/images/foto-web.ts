import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { geminiKey } from '@/lib/ai/gemini-client'

// Fotos reais de produto, achadas na internet: o Gemini com a Busca do Google
// encontra páginas de produto de lojas brasileiras; de cada página tiramos a
// foto principal (og:image / dados do produto). A foto é copiada para o nosso
// storage (leve, 640px) e vira a imagem do material no catálogo.

const UA = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
  'Accept-Language': 'pt-BR,pt;q=0.9',
}

function fotoDaPagina(html: string, base: string): string | null {
  const achar = (re: RegExp) => html.match(re)?.[1] ?? null
  let img =
    achar(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)/i) ||
    achar(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image/i) ||
    achar(/<meta[^>]+name=["']twitter:image["'][^>]*content=["']([^"']+)/i)
  if (!img) {
    for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
      try {
        const walk = (o: unknown): string | null => {
          if (!o || typeof o !== 'object') return null
          if (Array.isArray(o)) {
            for (const x of o) { const r = walk(x); if (r) return r }
            return null
          }
          const obj = o as Record<string, unknown>
          const tipo = obj['@type']
          if ((tipo === 'Product' || (Array.isArray(tipo) && tipo.includes('Product'))) && obj.image) {
            const i = obj.image as unknown
            if (typeof i === 'string') return i
            if (Array.isArray(i)) return typeof i[0] === 'string' ? i[0] : (i[0] as { url?: string })?.url ?? null
            return (i as { url?: string }).url ?? null
          }
          for (const v of Object.values(obj)) { const r = walk(v); if (r) return r }
          return null
        }
        img = walk(JSON.parse(m[1]))
        if (img) break
      } catch {}
    }
  }
  if (!img) return null
  try {
    const url = new URL(img.replace(/&amp;/g, '&'), base)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

async function paginasDeProduto(termo: string): Promise<string[]> {
  const key = geminiKey()
  if (!key) return []
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `Procure na internet páginas de PRODUTO (não de busca, não de categoria) de lojas brasileiras de material de construção ou do fabricante para: ${termo}. Liste até 6.` }] }],
      tools: [{ google_search: {} }],
    }),
    signal: AbortSignal.timeout(45_000),
  })
  if (!res.ok) throw new Error(`Busca HTTP ${res.status}`)
  const d = await res.json()
  const cand = d?.candidates?.[0]
  const texto = (cand?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? '').join('')
  const fontes: string[] = (cand?.groundingMetadata?.groundingChunks ?? []).map((c: { web?: { uri?: string } }) => c.web?.uri).filter(Boolean)
  return [...new Set([...fontes, ...(texto.match(/https?:\/\/[^\s"')\]>]+/g) ?? [])])].slice(0, 10)
}

// Até 6 URLs de fotos de produto para o termo (na ordem em que foram achadas).
export async function buscarFotosNaWeb(termo: string): Promise<string[]> {
  const paginas = await paginasDeProduto(termo)
  const fotos = await Promise.all(
    paginas.map(async (u) => {
      try {
        const r = await fetch(u, { headers: UA, redirect: 'follow', signal: AbortSignal.timeout(12_000) })
        if (!r.ok || !(r.headers.get('content-type') ?? '').includes('html')) return null
        return fotoDaPagina((await r.text()).slice(0, 800_000), r.url)
      } catch {
        return null
      }
    })
  )
  return [...new Set(fotos.filter((f): f is string => !!f))].slice(0, 6)
}

async function baixarImagem(url: string): Promise<{ bytes: Buffer; mime: string } | null> {
  try {
    const r = await fetch(url, { headers: UA, redirect: 'follow', signal: AbortSignal.timeout(15_000) })
    const mime = r.headers.get('content-type') ?? ''
    if (!r.ok || !mime.startsWith('image/')) return null
    const bytes = Buffer.from(await r.arrayBuffer())
    if (bytes.length < 2_000 || bytes.length > 8_000_000) return null
    return { bytes, mime }
  } catch {
    return null
  }
}

async function compactar(bytes: Buffer, mime: string) {
  try {
    const sharp = (await import('sharp')).default
    const out = await sharp(bytes).resize(640, 640, { fit: 'contain', background: '#ffffff' }).flatten({ background: '#ffffff' }).webp({ quality: 82 }).toBuffer()
    return { bytes: out, mime: 'image/webp', ext: 'webp' }
  } catch {
    return { bytes, mime, ext: mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg' }
  }
}

type Entrada = { materialCatalogoId: string; categoriaId: string | null; nome: string; evitar?: string[] }

// Busca a foto do material na internet e a salva como imagem principal do
// catálogo. `evitar` = fotos de origem já usadas (para "Outra foto").
// Retorna a URL no nosso storage, ou null se nada foi achado.
export async function buscarFotoMaterial({ materialCatalogoId, categoriaId, nome, evitar = [] }: Entrada): Promise<string | null> {
  const candidatas = (await buscarFotosNaWeb(nome)).filter((u) => !evitar.includes(u))
  for (const origem of candidatas) {
    const baixada = await baixarImagem(origem)
    if (!baixada) continue
    const img = await compactar(baixada.bytes, baixada.mime)
    const supabase = createAdminSupabaseClient()
    const path = `materiais/${materialCatalogoId}/web-${Date.now()}.${img.ext}`
    const { error: upErr } = await supabase.storage.from('material-images').upload(path, img.bytes, { contentType: img.mime, upsert: false })
    if (upErr) throw new Error(`Erro ao salvar foto: ${upErr.message}`)
    const url = supabase.storage.from('material-images').getPublicUrl(path).data.publicUrl

    await supabase.from('material_images').update({ principal: false }).eq('material_catalogo_id', materialCatalogoId)
    const { error } = await supabase.from('material_images').insert({
      material_catalogo_id: materialCatalogoId,
      categoria_id: categoriaId,
      nome_material: nome,
      image_url: url,
      origem: 'referencia_web',
      termos_busca: [nome, `fonte:${origem}`],
      aprovado: true,
      principal: true,
    })
    if (error) throw new Error(`Erro ao registrar foto: ${error.message}`)
    // Itens de pedido deste material que estavam sem foto (ou com a antiga
    // imagem gerada por IA) passam a usar a foto achada.
    await supabase
      .from('pedido_compra_itens')
      .update({ imagem_referencia_url: url, imagem_origem: 'referencia_web', imagem_aprovada: true })
      .eq('material_catalogo_id', materialCatalogoId)
      .or('imagem_referencia_url.is.null,imagem_origem.eq.imagem_ilustrativa')
    return url
  }
  return null
}

// Fotos de origem já usadas para o material (para não repetir em "Outra foto").
export async function fontesJaUsadas(materialCatalogoId: string): Promise<string[]> {
  const supabase = createAdminSupabaseClient()
  const { data } = await supabase.from('material_images').select('termos_busca').eq('material_catalogo_id', materialCatalogoId)
  return (data ?? []).flatMap((r) => (r.termos_busca as string[] | null) ?? []).filter((t) => t.startsWith('fonte:')).map((t) => t.slice(6))
}
