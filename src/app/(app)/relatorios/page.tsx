import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground">Indicadores de pedidos, obras e fornecedores.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Em desenvolvimento</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Os relatórios serão implementados após o fluxo de pedidos.
        </CardContent>
      </Card>
    </div>
  )
}
