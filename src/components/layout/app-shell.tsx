import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppHeader } from '@/components/layout/app-header'
import { getCurrentUser } from '@/lib/auth/get-current-user'

export async function AppShell({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentUser()

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
