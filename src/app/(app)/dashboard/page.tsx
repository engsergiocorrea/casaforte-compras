import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral dos pedidos de compra da Casa Forte.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pedidos em aberto
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">—</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes de revisão
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">—</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes de aprovação
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">—</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Urgentes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">—</CardContent>
        </Card>
      </div>
    </div>
  )
}
