import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { isEvolutionApiConfigured } from '@/lib/whatsapp/evolution-client'

function statusBadge(configurado: boolean) {
  return configurado ? (
    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
      Configurado
    </Badge>
  ) : (
    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
      A configurar
    </Badge>
  )
}

export default function ConfiguracoesPage() {
  const supabaseConfigurado = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const iaConfigurado = Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY)
  const evolutionConfigurado = isEvolutionApiConfigured()
  const storageConfigurado = supabaseConfigurado

  const configCards = [
    {
      titulo: 'Supabase',
      descricao: 'Conexão com banco de dados, autenticação e storage.',
      configurado: supabaseConfigurado,
    },
    {
      titulo: 'IA',
      descricao: 'Enriquecimento automático de materiais via IA (Gemini/OpenAI).',
      configurado: iaConfigurado,
    },
    {
      titulo: 'WhatsApp',
      descricao:
        'Envio de pedidos de compra aos fornecedores via Evolution API (EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE).',
      configurado: evolutionConfigurado,
    },
    {
      titulo: 'Storage',
      descricao: 'Armazenamento de PDFs, HTMLs e imagens dos pedidos de compra.',
      configurado: storageConfigurado,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Integrações e parâmetros do sistema.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {configCards.map((card) => (
          <Card key={card.titulo}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{card.titulo}</CardTitle>
              {statusBadge(card.configurado)}
            </CardHeader>
            <CardContent className="text-muted-foreground">{card.descricao}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
