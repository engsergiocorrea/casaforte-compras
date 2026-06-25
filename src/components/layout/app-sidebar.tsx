'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ClipboardList,
  Building2,
  Truck,
  HardHat,
  Tags,
  BookImage,
  BarChart3,
  Settings,
  Users,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { CasaForteLogo } from '@/components/shared/casa-forte-logo'
import type { ProfileRole } from '@/types/database'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pedidos', label: 'Pedidos', icon: ClipboardList },
  { href: '/obras', label: 'Obras', icon: Building2 },
  { href: '/fornecedores', label: 'Fornecedores', icon: Truck },
  { href: '/engenheiros', label: 'Engenheiros', icon: HardHat },
  { href: '/categorias', label: 'Categorias', icon: Tags },
  { href: '/catalogo', label: 'Catálogo', icon: BookImage },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

// "Pessoas e Acessos" só é visível para quem pode cadastrar pessoas e
// gerenciar permissões: admin e diretoria.
function canManagePeople(role: ProfileRole | null | undefined) {
  return role === 'admin' || role === 'diretoria'
}

export function AppSidebar({ role }: { role?: ProfileRole | null }) {
  const pathname = usePathname()
  const items = canManagePeople(role)
    ? [...navItems, { href: '/pessoas', label: 'Pessoas e Acessos', icon: Users }]
    : navItems

  return (
    <Sidebar>
      <SidebarHeader className="gap-2 border-b border-sidebar-border px-4 py-5">
        <CasaForteLogo variant="sidebar" fallbackClassName="text-sidebar-foreground" />
        <span className="text-xs font-medium tracking-wide text-sidebar-foreground/60 uppercase">
          Sistema de Compras
        </span>
      </SidebarHeader>
      <SidebarContent className="px-1 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      className="gap-2.5 rounded-lg font-medium data-active:bg-sidebar-primary/15 data-active:text-sidebar-primary data-active:font-semibold"
                    >
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
