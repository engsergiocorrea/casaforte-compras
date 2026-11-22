'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  ClipboardList,
  PlusCircle,
  BookImage,
  Truck,
  Building2,
  Tags,
  Settings,
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
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { CasaForteLogo } from '@/components/shared/casa-forte-logo'

// Menu enxuto: o dia a dia (pedidos e catálogo) em cima, cadastros de apoio
// embaixo. Pessoas/Engenheiros vivem no Portal; Relatórios saiu (estava vazio).
const grupos = [
  {
    titulo: 'Compras',
    itens: [
      { href: '/dashboard', label: 'Início', icon: Home },
      { href: '/pedidos/novo', label: 'Novo pedido', icon: PlusCircle },
      { href: '/pedidos', label: 'Pedidos', icon: ClipboardList },
      { href: '/catalogo', label: 'Materiais', icon: BookImage },
      { href: '/fornecedores', label: 'Fornecedores', icon: Truck },
    ],
  },
  {
    titulo: 'Ajustes',
    itens: [
      { href: '/obras', label: 'Obras', icon: Building2 },
      { href: '/categorias', label: 'Categorias', icon: Tags },
      { href: '/configuracoes', label: 'Configurações', icon: Settings },
    ],
  },
]

function ativo(pathname: string, href: string) {
  if (href === '/pedidos') return pathname === '/pedidos' || (pathname.startsWith('/pedidos/') && !pathname.startsWith('/pedidos/novo'))
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppSidebar() {
  const pathname = usePathname()
  // No celular o menu é uma gaveta: fecha ao escolher um item.
  const { setOpenMobile } = useSidebar()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-2 border-b border-sidebar-border px-4 py-5 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-4">
        <CasaForteLogo variant="sidebar" fallbackClassName="text-sidebar-foreground" />
        <span className="text-xs font-medium tracking-wide text-sidebar-foreground/60 uppercase group-data-[collapsible=icon]:hidden">
          Sistema de Compras
        </span>
      </SidebarHeader>
      <SidebarContent className="px-1 py-2">
        {grupos.map((grupo) => (
          <SidebarGroup key={grupo.titulo}>
            <SidebarGroupLabel className="text-sidebar-foreground/50">{grupo.titulo}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {grupo.itens.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} onClick={() => setOpenMobile(false)} />}
                      isActive={ativo(pathname, item.href)}
                      tooltip={item.label}
                      className="gap-2.5 rounded-lg font-medium data-active:bg-sidebar-primary/15 data-active:text-sidebar-primary data-active:font-semibold"
                    >
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
