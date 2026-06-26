import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CasaForteLogo } from '@/components/shared/casa-forte-logo'

export default async function SemAcessoPage({
  searchParams,
}: {
  searchParams: Promise<{ motivo?: string }>
}) {
  const { motivo } = await searchParams
  const indisponivel = motivo === 'indisponivel'
  const portalUrl = process.env.CASAFORTE_PORTAL_URL ?? 'https://sistemas.casaforteinc.com.br'

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/40 px-4">
      <Card className="w-full max-w-md border-foreground/5 shadow-lg">
        <CardHeader className="justify-items-center space-y-3 pb-2 text-center">
          <CasaForteLogo variant="login" className="mx-auto" />
          <CardTitle>{indisponivel ? 'Serviço de permissões indisponível' : 'Acesso não permitido'}</CardTitle>
          <CardDescription className="text-balance">
            {indisponivel
              ? 'Não foi possível confirmar sua permissão no Portal Casa Forte agora. Tente novamente em alguns minutos.'
              : 'Sua conta ainda não tem permissão para acessar o Compras. Solicite acesso à administração no Portal Casa Forte.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link href={portalUrl} className="text-sm font-medium text-primary underline">
            Ir para o Portal Casa Forte
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
