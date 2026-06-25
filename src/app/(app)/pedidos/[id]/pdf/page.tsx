import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generatePurchaseOrderHtml } from '@/lib/pdf/purchase-order-html'
import type {
  Engenheiro,
  Obra,
  PedidoCompra,
  PedidoCompraItem,
  Profile,
} from '@/types/database'

export default async function PedidoPdfPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: pedido, error } = await supabase
    .from('pedidos_compra')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!pedido) {
    notFound()
  }

  const pedidoTyped = pedido as PedidoCompra

  const [{ data: obra }, { data: solicitante }, { data: engenheiro }, { data: itens }] =
    await Promise.all([
      supabase.from('obras').select('*').eq('id', pedidoTyped.obra_id).maybeSingle(),
      pedidoTyped.solicitante_id
        ? supabase.from('profiles').select('*').eq('id', pedidoTyped.solicitante_id).maybeSingle()
        : Promise.resolve({ data: null }),
      pedidoTyped.engenheiro_id
        ? supabase
            .from('engenheiros')
            .select('*')
            .eq('id', pedidoTyped.engenheiro_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from('pedido_compra_itens')
        .select('*')
        .eq('pedido_compra_id', id)
        .order('created_at'),
    ])

  const html = generatePurchaseOrderHtml({
    pedido: pedidoTyped,
    obra: obra as Obra | null,
    solicitante: solicitante as Profile | null,
    engenheiro: engenheiro as Engenheiro | null,
    itens: (itens as PedidoCompraItem[]) ?? [],
  })

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-bold">Pré-visualização do pedido #{pedidoTyped.numero}</h1>
        <p className="text-muted-foreground">
          Esta é a mesma renderização salva ao clicar em &quot;Gerar PDF&quot; na tela do pedido.
        </p>
      </div>
      <iframe
        srcDoc={html}
        title={`Pedido de compra #${pedidoTyped.numero}`}
        className="h-[calc(100vh-12rem)] w-full rounded-lg border bg-white"
      />
    </div>
  )
}
