import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { CasaForteLogo } from '@/components/shared/casa-forte-logo'
import { logout } from '@/app/login/actions'
import type { Profile } from '@/types/database'

export function AppHeader({ profile }: { profile: Profile | null }) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <div className="md:hidden">
          <CasaForteLogo variant="header" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        {profile ? (
          <div className="text-right text-sm">
            <p className="font-medium">{profile.nome}</p>
            <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
          </div>
        ) : null}
        <form action={logout}>
          <Button type="submit" variant="outline" size="sm">
            Sair
          </Button>
        </form>
      </div>
    </header>
  )
}
