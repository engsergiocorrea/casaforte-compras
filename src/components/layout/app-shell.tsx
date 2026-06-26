import { redirect } from 'next/navigation'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppHeader } from '@/components/layout/app-header'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { checkCompraAccess } from '@/lib/portal/access'

export async function AppShell({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentUser()

  // O Portal Casa Forte é a fonte central de permissões (Etapa D da
  // integração — ver docs/integracao-modulos.md no repo casaforte-portal).
  // Só checamos quando há profile resolvido; sem profile, o proxy
  // (middleware) já redireciona para /login antes de chegar aqui.
  if (profile?.email) {
    const access = await checkCompraAccess(profile.email)
    if (access.status === 'denied') {
      redirect('/sem-acesso')
    }
    if (access.status === 'unavailable') {
      redirect('/sem-acesso?motivo=indisponivel')
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex min-h-screen w-full flex-col bg-background">
        <AppHeader profile={profile} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </SidebarProvider>
  )
}
