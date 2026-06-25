export const FALLBACK_ALERT_MESSAGE =
  'IA indisponível ou retorno inválido. Conferir informações manualmente.'

// Reconhece qualquer alerta que indique que o item foi processado pelo
// fallback local (chave ausente/curta, ou falha ao chamar o provedor),
// usado pelo painel de IA para mostrar o aviso de preparação básica.
export function isFallbackAlert(alerta: string): boolean {
  return (
    alerta === FALLBACK_ALERT_MESSAGE ||
    alerta === 'GEMINI_API_KEY não configurada.' ||
    alerta === 'OPENAI_API_KEY não configurada.' ||
    alerta.startsWith('Erro ao consultar Gemini:') ||
    alerta.startsWith('Erro ao consultar OpenAI:')
  )
}
