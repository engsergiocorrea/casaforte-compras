import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AprovacaoAcao } from '@/types/database'

const ACAO_LABELS: Record<AprovacaoAcao, string> = {
  criado: 'Pedido criado',
  enviado_revisao: 'Enviado para revisão',
  revisado: 'Revisão iniciada',
  enviado_aprovacao: 'Enviado para aprovação',
  aprovado: 'Pedido aprovado',
  rejeitado: 'Pedido rejeitado',
  devolvido: 'Pedido devolvido',
  enviado_whatsapp: 'Enviado por WhatsApp',
  cancelado: 'Pedido cancelado',
  marcado_comprado: 'Marcado como comprado',
  pdf_gerado: 'PDF gerado',
  ia_preparado: 'Preparado por IA',
}

type HistoryEntry = {
  id: string
  acao: AprovacaoAcao
  comentario: string | null
  created_at: string
  user: { nome: string } | null
}

export function PedidoHistory({ entries }: { entries: HistoryEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Histórico</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem histórico ainda.</p>
        ) : (
          <ol className="space-y-3 border-l pl-4">
            {entries.map((entry) => (
              <li key={entry.id} className="text-sm">
                <p className="font-medium">{ACAO_LABELS[entry.acao] ?? entry.acao}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.user?.nome ?? 'Sistema'} ·{' '}
                  {new Date(entry.created_at).toLocaleString('pt-BR')}
                </p>
                {entry.comentario ? (
                  <p className="mt-1 rounded-md bg-muted p-2 text-sm">{entry.comentario}</p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
