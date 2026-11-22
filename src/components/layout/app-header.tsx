import { SidebarTrigger } from '@/components/ui/sidebar'
import { CasaForteLogo } from '@/components/shared/casa-forte-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { logout } from '@/app/login/actions'
import type { Profile } from '@/types/database'

const PAPEL: Record<string, string> = {
  admin: 'Administrador',
  diretoria: 'Diretoria',
  compras: 'Compras',
  engenheiro: 'Engenheiro',
  visualizador: 'Visualizador',
}

// Barra superior em material translúcido: o conteúdo rola por baixo dela.
export function AppHeader({ profile }: { profile: Profile | null }) {
  const inicial = profile?.nome?.trim()?.[0]?.toUpperCase() ?? '?'
  return (
    <header className="cf-material sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border/60 px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="size-9" />
        <div className="md:hidden">
          <CasaForteLogo variant="header" />
        </div>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <ThemeToggle />
        {profile ? (
          <div className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-1 sm:pr-3">
            <span className="grid size-8 place-items-center rounded-full bg-primary/12 text-sm font-semibold text-primary">
              {inicial}
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-[13px] font-medium">{profile.nome}</span>
              <span className="block text-[11px] text-muted-foreground">{PAPEL[profile.role] ?? profile.role}</span>
            </span>
          </div>
        ) : null}
        <form action={logout}>
          <button
            type="submit"
            className="h-8 rounded-full px-3 text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Sair
          </button>
        </form>
      </div>
    </header>
  )
}
