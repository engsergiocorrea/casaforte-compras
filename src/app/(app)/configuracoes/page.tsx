import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const CONFIG_CARDS = [
  {
    titulo: 'Supabase',
    descricao: 'Conexão com banco de dados, autenticação e storage.',
  },
  {
    titulo: 'IA',
    descricao: 'Enriquecimento automático de materiais e resolução de imagens.',
  },
  {
    titulo: 'WhatsApp',
    descricao: 'Envio de pedidos de compra aos fornecedores via WhatsApp Cloud API.',
  },
  {
    titulo: 'Storage',
    descricao: 'Armazenamento de PDFs, HTMLs e imagens dos pedidos de compra.',
  },
]

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Integrações e parâmetros do sistema.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {CONFIG_CARDS.map((card) => (
          <Card key={card.titulo}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{card.titulo}</CardTitle>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                A configurar
              </Badge>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              {card.descricao}
              <br />
              A configurar nas próximas etapas.
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
