import { redirect } from 'next/navigation'

// Relatórios saiu do menu (estava vazio). Quem tiver o link antigo vai para o Início.
export default function RelatoriosPage() {
  redirect('/dashboard')
}
