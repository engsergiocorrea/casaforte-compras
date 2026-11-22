import { Badge } from '@/components/ui/badge'
import { isEvolutionApiConfigured } from '@/lib/whatsapp/evolution-client'

function statusBadge(configurado: boolean) {
  return configurado ? (
    <Badge variant="outline" className="shrink-0 rounded-full border-transparent bg-emerald-500/14 text-emerald-700 dark:text-emerald-300">
      Configurado
    </Badge>
  ) : (
    <Badge variant="outline" className="shrink-0 rounded-full border-transparent bg-amber-500/14 text-amber-700 dark:text-amber-300">
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
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-[28px] sm:text-3xl">Configurações</h1>
      <p className="-mt-3 text-muted-foreground">Integrações do sistema.</p>
      <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_oklch(0_0_0/4%),0_0_0_0.5px_oklch(0_0_0/5%)]">
        {configCards.map((card) => (
          <li key={card.titulo} className="flex items-start justify-between gap-4 px-4 py-3.5">
            <div className="min-w-0">
              <p className="font-medium">{card.titulo}</p>
              <p className="text-[13px] text-muted-foreground">{card.descricao}</p>
            </div>
            {statusBadge(card.configurado)}
          </li>
        ))}
      </ul>
    </div>
  )
}
