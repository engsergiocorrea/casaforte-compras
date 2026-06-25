import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardList, ClipboardCheck, BadgeCheck, Flame } from 'lucide-react'

const METRICS = [
  { label: 'Pedidos em aberto', icon: ClipboardList },
  { label: 'Pendentes de revisão', icon: ClipboardCheck },
  { label: 'Pendentes de aprovação', icon: BadgeCheck },
  { label: 'Urgentes', icon: Flame },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral dos pedidos de compra da Casa Forte.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map(({ label, icon: Icon }) => (
          <Card key={label} className="border-foreground/5">
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className="size-4 text-primary" />
            </CardHeader>
            <CardContent className="font-heading text-3xl font-bold tracking-tight">
              —
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
