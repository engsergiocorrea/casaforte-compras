import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { geminiImagem } from './gemini-client'

type Entrada = {
  materialCatalogoId: string
  categoriaId: string | null
  nome: string
  especificacao?: string | null
  createdBy?: string | null
}

// Reduz a imagem gerada (≈1024px, ~500KB) para 640px WEBP, leve no celular.
// Se o sharp não estiver disponível no servidor, guarda a original.
async function compactar(bytes: Buffer, mime: string): Promise<{ bytes: Buffer; mime: string; ext: string }> {
  try {
    const sharp = (await import('sharp')).default
    const out = await sharp(bytes).resize(640, 640, { fit: 'inside' }).webp({ quality: 80 }).toBuffer()
    return { bytes: out, mime: 'image/webp', ext: 'webp' }
  } catch {
    return { bytes, mime, ext: mime.includes('png') ? 'png' : 'jpg' }
  }
}

function montarPrompt(nome: string, especificacao?: string | null) {
  const detalhe = especificacao ? ` Detalhes: ${especificacao.slice(0, 300)}` : ''
  return (
    `Foto de catálogo de produto, estilo e-commerce de loja de material de construção no Brasil: ${nome}.${detalhe} ` +
    'Mostrar só o produto, inteiro, centralizado, fundo branco liso, iluminação de estúdio suave, ' +
    'sem marca registrada, sem logotipo, sem pessoas, sem cenário. Imagem quadrada.'
  )
}

// Gera com IA uma imagem ilustrativa do material, salva no bucket
// `material-images` e registra como imagem principal aprovada do catálogo
// (reaproveitada em todos os pedidos seguintes). Retorna a URL pública.
export async function gerarImagemMaterial({ materialCatalogoId, categoriaId, nome, especificacao, createdBy }: Entrada): Promise<string> {
  const gerada = await geminiImagem(montarPrompt(nome, especificacao))
  const img = await compactar(gerada.bytes, gerada.mime)
  const supabase = createAdminSupabaseClient()
  const path = `materiais/${materialCatalogoId}/ia-${Date.now()}.${img.ext}`

  const { error: upErr } = await supabase.storage.from('material-images').upload(path, img.bytes, { contentType: img.mime, upsert: false })
  if (upErr) throw new Error(`Erro ao salvar imagem: ${upErr.message}`)
  const url = supabase.storage.from('material-images').getPublicUrl(path).data.publicUrl

  // Uma só imagem principal por material.
  await supabase.from('material_images').update({ principal: false }).eq('material_catalogo_id', materialCatalogoId)
  const { error } = await supabase.from('material_images').insert({
    material_catalogo_id: materialCatalogoId,
    categoria_id: categoriaId,
    nome_material: nome,
    image_url: url,
    origem: 'imagem_ilustrativa',
    termos_busca: [nome],
    aprovado: true,
    principal: true,
    created_by: createdBy ?? null,
  })
  if (error) throw new Error(`Erro ao registrar imagem: ${error.message}`)
  return url
}
