import { LoginShell, Campo, Erro } from '@/components/cf-login/shell'
import { CampoSenha, BotaoEntrar } from '@/components/cf-login/senha'
import { login } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <LoginShell sistema="Compras" descricao="Pedidos de materiais, fornecedores e catálogo.">
      <form action={login}>
        <Campo rotulo="E-mail" name="email" type="email" required autoComplete="email" autoCapitalize="none" placeholder="seu@email.com" />
        <CampoSenha name="password" required />
        <div className="cfl-acoes"><a className="cfl-link" href="https://sistemas.casaforteinc.com.br/recuperar-senha">Esqueci minha senha</a></div>
        <Erro>{error}</Erro>
        <BotaoEntrar />
      </form>
    </LoginShell>
  )
}
