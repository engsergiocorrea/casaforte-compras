// Cliente server-only para a Evolution API (WhatsApp).
//
// IMPORTANTE: este arquivo nunca deve ser importado por componentes client.
// As variáveis EVOLUTION_API_URL / EVOLUTION_API_KEY / EVOLUTION_INSTANCE são
// lidas via process.env e não têm prefixo NEXT_PUBLIC_, então não ficam
// disponíveis no bundle do navegador.
//
// O formato exato do endpoint/payload pode variar entre versões da Evolution
// API. Implementamos aqui o formato mais comum (v1/v2):
//   POST {EVOLUTION_API_URL}/message/sendText/{instance}
//   header: apikey: {EVOLUTION_API_KEY}
//   body: { number: "<telefone>", text: "<mensagem>" }
// Isso ainda precisa ser validado contra a instância real pelo usuário —
// se a resposta vier em outro formato, ajuste o parsing abaixo.

type EvolutionSendTextSuccess = {
  success: true
  messageId: string | null
  raw: unknown
}

type EvolutionSendTextFailure = {
  success: false
  error: string
  raw?: unknown
}

export type EvolutionSendTextResult = EvolutionSendTextSuccess | EvolutionSendTextFailure

function getEvolutionConfig() {
  const apiUrl = process.env.EVOLUTION_API_URL?.trim().replace(/\/$/, '')
  const apiKey = process.env.EVOLUTION_API_KEY?.trim()
  const instance = process.env.EVOLUTION_INSTANCE?.trim() || 'casaforte'

  if (!apiUrl || !apiKey) {
    return null
  }

  return { apiUrl, apiKey, instance }
}

export function isEvolutionApiConfigured() {
  return getEvolutionConfig() !== null
}

/**
 * Normaliza um número de telefone brasileiro para o formato esperado pela
 * Evolution API (geralmente DDI + DDD + número, sem caracteres especiais).
 * Ex.: "(81) 99999-9999" -> "5581999999999"
 */
function normalizePhoneNumber(rawPhone: string) {
  const digitsOnly = rawPhone.replace(/\D/g, '')

  if (digitsOnly.length === 0) {
    return ''
  }

  // Se já tem código do país (Brasil = 55) e tamanho compatível, mantém.
  if (digitsOnly.startsWith('55') && digitsOnly.length >= 12) {
    return digitsOnly
  }

  // Caso contrário, assume número nacional e prefixa o DDI do Brasil.
  return `55${digitsOnly}`
}

/**
 * Envia uma mensagem de texto via Evolution API.
 *
 * Trata erros de configuração ausente, falhas de rede e respostas HTTP não
 * OK, sempre retornando um resultado tipado (nunca lança exceção).
 */
export async function sendWhatsappText(params: {
  phone: string
  message: string
}): Promise<EvolutionSendTextResult> {
  const config = getEvolutionConfig()

  if (!config) {
    return {
      success: false,
      error:
        'Evolution API não está configurada. Defina EVOLUTION_API_URL e EVOLUTION_API_KEY no ambiente.',
    }
  }

  const phone = normalizePhoneNumber(params.phone)

  if (!phone) {
    return { success: false, error: 'Telefone do fornecedor inválido.' }
  }

  const endpoint = `${config.apiUrl}/message/sendText/${config.instance}`

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: config.apiKey,
      },
      body: JSON.stringify({
        number: phone,
        text: params.message,
      }),
    })

    let body: unknown = null
    try {
      body = await response.json()
    } catch {
      // Resposta sem corpo JSON; seguimos com body = null.
    }

    if (!response.ok) {
      const errorMessage =
        (body && typeof body === 'object' && 'message' in body
          ? String((body as { message?: unknown }).message)
          : null) ?? `Evolution API retornou status ${response.status}.`

      return { success: false, error: errorMessage, raw: body }
    }

    // Tentativas comuns de onde a Evolution API costuma colocar o id da
    // mensagem enviada. Ajustar conforme o formato real observado em testes.
    const messageId =
      (body &&
        typeof body === 'object' &&
        ((body as Record<string, unknown>).key as Record<string, unknown> | undefined)?.id) ??
      (body && typeof body === 'object' ? (body as Record<string, unknown>).messageId : null) ??
      null

    return {
      success: true,
      messageId: typeof messageId === 'string' ? messageId : null,
      raw: body,
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? `Erro de conexão com a Evolution API: ${error.message}`
          : 'Erro de conexão com a Evolution API.',
    }
  }
}
