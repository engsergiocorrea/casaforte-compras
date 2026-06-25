import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PedidosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pedidos de Compra</h1>
        <p className="text-muted-foreground">Pedidos de materiais das obras da Casa Forte.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Em desenvolvimento</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          O módulo de pedidos será implementado na Etapa 4.
        </CardContent>
      </Card>
    </div>
  )
}
