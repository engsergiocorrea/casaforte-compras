import Link from 'next/link'
import { ArrowRight, BookImage, ClipboardList, Clock, CheckCircle2, PlusCircle, Sparkles } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { OrderStatusBadge } from '@/components/pedidos/order-status-badge'
import type { PedidoStatus } from '@/types/database'

export const dynamic = 'force-dynamic'

type PedidoRecente = {
  id: string
  numero: number
  status: PedidoStatus
  created_at: string
  obra: { nome: string } | null
  itens: { count: number }[]
}

function saudacao() {
  const h = Number(new Intl.DateTimeFormat('pt-BR', { hour: 'numeric', hour12: false, timeZone: 'America/Sao_Paulo' }).format(new Date()))
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

const dataCurta = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(iso))

export default async function InicioPage() {
  const supabase = await createServerSupabaseClient()
  const profile = await getCurrentUser()
  const desde30 = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const conta = (status: string[], desde?: string) => {
    let q = supabase.from('pedidos_compra').select('id', { count: 'exact', head: true }).in('status', status)
    if (desde) q = q.gte('created_at', desde)
    return q
  }

  const [rascunhos, aguardando, aprovados, recentes, materiais, comImagem] = await Promise.all([
    conta(['rascunho', 'devolvido']),
    conta(['pendente_aprovacao', 'pendente_revisao', 'em_revisao']),
    conta(['aprovado', 'enviado', 'respondido', 'parcialmente_comprado', 'comprado'], desde30),
    supabase
      .from('pedidos_compra')
      .select('id, numero, status, created_at, obra:obras(nome), itens:pedido_compra_itens(count)')
      .neq('status', 'cancelado')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase.from('materiais_catalogo').select('id', { count: 'exact', head: true }).eq('ativo', true),
    supabase.from('material_images').select('material_catalogo_id', { count: 'exact', head: true }).eq('principal', true).eq('aprovado', true).neq('origem', 'imagem_ilustrativa'),
  ])

  const nome = (profile?.nome as string | undefined)?.split(' ')[0]
  const pedidos = (recentes.data as unknown as PedidoRecente[]) ?? []

  const cards = [
    { label: 'Rascunhos', valor: rascunhos.count ?? 0, href: '/pedidos?status=rascunho', icon: ClipboardList },
    { label: 'Aguardando aprovação', valor: aguardando.count ?? 0, href: '/pedidos?status=pendente_aprovacao', icon: Clock },
    { label: 'Aprovados (30 dias)', valor: aprovados.count ?? 0, href: '/pedidos?status=aprovado', icon: CheckCircle2 },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            {saudacao()}{nome ? `, ${nome}` : ''}
          </h1>
          <p className="text-muted-foreground">O que vamos comprar hoje?</p>
        </div>
        <Link
          href="/pedidos/novo"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          <PlusCircle className="size-5" /> Novo pedido
        </Link>
      </div>

      <Link
        href="/pedidos/novo"
        className="group flex items-start gap-4 rounded-2xl border border-primary/25 bg-primary/5 p-5 transition hover:border-primary/50"
      >
        <span className="rounded-xl bg-primary/15 p-2.5 text-primary">
          <Sparkles className="size-5" />
        </span>
        <span className="flex-1">
          <span className="block font-semibold">Cole a lista e deixe com a IA</span>
          <span className="block text-sm text-muted-foreground">
            Mande a lista do jeito que vier do WhatsApp. A IA separa os itens, padroniza os nomes,
            coloca as imagens e avisa se algo estiver estranho.
          </span>
        </span>
        <ArrowRight className="mt-1 size-5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </Link>

      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map(({ label, valor, href, icon: Icon }) => (
          <Link key={label} href={href} className="rounded-2xl border bg-card p-4 transition hover:border-primary/40">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              {label} <Icon className="size-4 text-primary" />
            </div>
            <div className="mt-1 font-heading text-3xl font-bold tracking-tight">{valor}</div>
          </Link>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Últimos pedidos</h2>
          {pedidos.length > 0 ? (
            <Link href="/pedidos" className="text-sm font-medium text-primary hover:underline">
              Ver todos
            </Link>
          ) : null}
        </div>

        {pedidos.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center">
            <p className="font-medium">Nenhum pedido ainda</p>
            <p className="mt-1 text-sm text-muted-foreground">Comece criando o primeiro pedido de compra.</p>
            <Link href="/pedidos/novo" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              <PlusCircle className="size-4" /> Criar pedido
            </Link>
          </div>
        ) : (
          <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
            {pedidos.map((p) => (
              <li key={p.id}>
                <Link href={`/pedidos/${p.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-muted/50">
                  <span className="w-12 shrink-0 font-mono text-sm text-muted-foreground">#{p.numero}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.obra?.nome ?? 'Obra'}</span>
                    <span className="block text-xs text-muted-foreground">
                      {p.itens?.[0]?.count ?? 0} {p.itens?.[0]?.count === 1 ? 'item' : 'itens'} · {dataCurta(p.created_at)}
                    </span>
                  </span>
                  <OrderStatusBadge status={p.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href="/catalogo" className="flex items-center gap-3 rounded-2xl border bg-card p-4 transition hover:border-primary/40">
        <BookImage className="size-5 text-primary" />
        <span className="flex-1 text-sm">
          <span className="font-medium">{materiais.count ?? 0} materiais no catálogo</span>
          <span className="text-muted-foreground"> · {comImagem.count ?? 0} com imagem</span>
        </span>
        <ArrowRight className="size-4 text-muted-foreground" />
      </Link>
    </div>
  )
}
