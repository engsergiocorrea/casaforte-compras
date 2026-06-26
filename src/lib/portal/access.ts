// Integração com o Portal Casa Forte (fonte central de permissões).
// Ver docs/integracao-modulos.md no repositório casaforte-portal.

type PortalCheckResponse = {
  allowed: boolean
  profile: { id: string; nome: string; email: string; ativo: boolean } | null
}

export type PortalAccessResult =
  | { status: 'allowed' }
  | { status: 'denied' }
  | { status: 'unavailable' }

// Falha fechada (nega acesso) quando o Portal nega explicitamente, mas
// distingue isso de uma falha de rede/configuração ("unavailable") — um
// outage do Portal não deve ser indistinguível de "acesso negado" para
// quem for investigar.
export async function checkCompraAccess(email: string): Promise<PortalAccessResult> {
  const portalUrl = process.env.CASAFORTE_PORTAL_URL
  const apiKey = process.env.CASAFORTE_PORTAL_INTERNAL_API_KEY

  if (!portalUrl || !apiKey) {
    console.error('[portal] CASAFORTE_PORTAL_URL ou CASAFORTE_PORTAL_INTERNAL_API_KEY ausentes.')
    return { status: 'unavailable' }
  }

  try {
    const response = await fetch(`${portalUrl}/api/internal/access/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ email, module: 'compras', permission: 'acessar_compras' }),
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      console.error(`[portal] /access/check respondeu ${response.status}`)
      return { status: 'unavailable' }
    }

    const data = (await response.json()) as PortalCheckResponse
    return data.allowed ? { status: 'allowed' } : { status: 'denied' }
  } catch (error) {
    console.error('[portal] Falha ao consultar permissões:', (error as Error).message)
    return { status: 'unavailable' }
  }
}
