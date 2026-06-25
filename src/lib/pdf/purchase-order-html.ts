import fs from 'node:fs'
import path from 'node:path'
import type { Engenheiro, Obra, PedidoCompra, PedidoCompraItem, Profile } from '@/types/database'

type PurchaseOrderHtmlData = {
  pedido: PedidoCompra
  obra: Obra | null
  solicitante: Profile | null
  engenheiro: Engenheiro | null
  itens: PedidoCompraItem[]
}

const STATUS_LABELS: Record<PedidoCompra['status'], string> = {
  rascunho: 'Rascunho',
  pendente_revisao: 'Pendente de revisão',
  em_revisao: 'Em revisão',
  pendente_aprovacao: 'Pendente de aprovação',
  aprovado: 'Aprovado',
  enviado: 'Enviado',
  respondido: 'Respondido',
  parcialmente_comprado: 'Parcialmente comprado',
  comprado: 'Comprado',
  cancelado: 'Cancelado',
  devolvido: 'Devolvido',
}

const PRIORIDADE_LABELS: Record<PedidoCompra['prioridade'], string> = {
  baixa: 'Baixa',
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente',
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('pt-BR')
}

function casaForteLogoExists() {
  try {
    return fs.existsSync(path.join(process.cwd(), 'public', 'logo-casa-forte.png'))
  } catch {
    return false
  }
}

function renderLogo() {
  if (!casaForteLogoExists()) {
    return '<span class="brand-fallback">Casa Forte</span>'
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '') || ''
  const logoUrl = `${appUrl}/logo-casa-forte.png`

  return `<img class="brand-logo" src="${escapeHtml(logoUrl)}" alt="Casa Forte" />`
}

function renderItemImage(item: PedidoCompraItem) {
  if (!item.imagem_referencia_url) {
    return '<div class="no-image">Sem imagem cadastrada</div>'
  }

  const warning = !item.imagem_aprovada
    ? '<div class="image-warning">Imagem de referência — revisar</div>'
    : ''

  return `
    <img src="${escapeHtml(item.imagem_referencia_url)}" alt="${escapeHtml(
      item.nome_padronizado || item.nome_material
    )}" />
    ${warning}
  `
}

function renderItemCard(item: PedidoCompraItem, index: number) {
  const statusBadge = item.precisa_revisao
    ? '<span class="badge badge-revisar">Revisar</span>'
    : '<span class="badge badge-ok">OK</span>'

  const alertas =
    item.ia_alertas && item.ia_alertas.length > 0
      ? `<ul class="alertas">${item.ia_alertas
          .map((alerta) => `<li>${escapeHtml(alerta)}</li>`)
          .join('')}</ul>`
      : ''

  const detalhes: string[] = []

  if (item.especificacao_tecnica) {
    detalhes.push(`<p class="item-spec">${escapeHtml(item.especificacao_tecnica)}</p>`)
  }
  if (item.marca_preferencial) {
    detalhes.push(
      `<p><span class="label">Marca preferencial:</span> ${escapeHtml(item.marca_preferencial)}</p>`
    )
  }
  if (item.local_de_aplicacao) {
    detalhes.push(
      `<p><span class="label">Local de aplicação:</span> ${escapeHtml(item.local_de_aplicacao)}</p>`
    )
  }
  if (item.observacoes) {
    detalhes.push(`<p><span class="label">Observações:</span> ${escapeHtml(item.observacoes)}</p>`)
  }

  return `
    <div class="item-card">
      <div class="item-image">${renderItemImage(item)}</div>
      <div class="item-body">
        <div class="item-heading">
          <div>
            <span class="item-index">Item ${index + 1}</span>
            <h4>${escapeHtml(item.nome_padronizado || item.nome_material)}</h4>
            ${
              item.nome_padronizado && item.nome_padronizado !== item.nome_material
                ? `<p class="muted">Original: ${escapeHtml(item.nome_material)}</p>`
                : ''
            }
          </div>
          ${statusBadge}
        </div>
        ${detalhes.join('')}
        ${alertas}
      </div>
      <div class="item-qty">
        <span class="qty-value">${item.quantidade}</span>
        <span class="qty-unit">${escapeHtml(item.unidade || 'un')}</span>
      </div>
    </div>
  `
}

export function generatePurchaseOrderHtml(data: PurchaseOrderHtmlData) {
  const { pedido, obra, solicitante, engenheiro, itens } = data

  const itensComRevisao = itens.filter((item) => item.precisa_revisao).length
  const cards = itens.map((item, index) => renderItemCard(item, index)).join('')

  return `
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Pedido de Compra ${pedido.numero}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
    rel="stylesheet"
  />
  <style>
    :root {
      --brand: #E8390E;
      --ink: #211A17;
      --muted: #6B6259;
      --line: #E7E1DC;
      --surface: #FAF8F6;
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: 'Plus Jakarta Sans', Arial, sans-serif;
      color: var(--ink);
      margin: 0;
      padding: 36px 40px;
      background: #fff;
      font-size: 13px;
      line-height: 1.45;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      border-bottom: 3px solid var(--brand);
      padding-bottom: 20px;
      margin-bottom: 24px;
    }

    .brand-logo {
      max-height: 48px;
      max-width: 220px;
      object-fit: contain;
    }

    .brand-fallback {
      font-size: 24px;
      font-weight: 800;
      color: var(--brand);
      letter-spacing: -0.02em;
    }

    .brand-sub {
      margin-top: 4px;
      font-size: 11px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .title {
      text-align: right;
    }

    .title h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.01em;
    }

    .title .numero {
      color: var(--brand);
    }

    .title .meta {
      margin-top: 6px;
      font-size: 11px;
      color: var(--muted);
    }

    .badges-row {
      margin-top: 8px;
      display: flex;
      gap: 6px;
      justify-content: flex-end;
    }

    .pill {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
      background: var(--surface);
      border: 1px solid var(--line);
      color: var(--ink);
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 20px;
    }

    .info-card {
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 14px 16px;
      background: var(--surface);
    }

    .info-card h3 {
      margin: 0 0 8px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--brand);
    }

    .info-card p {
      margin: 3px 0;
      font-size: 12.5px;
      color: var(--ink);
    }

    .info-card .muted {
      color: var(--muted);
    }

    .revisao-alert {
      margin-bottom: 18px;
      padding: 12px 16px;
      border-radius: 10px;
      background: #FEF3C7;
      border: 1px solid #FCD34D;
      color: #92400E;
      font-size: 12.5px;
      font-weight: 700;
    }

    .observacoes {
      margin-bottom: 20px;
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 14px 16px;
      background: var(--surface);
    }

    .observacoes h3 {
      margin: 0 0 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--brand);
    }

    .observacoes p {
      margin: 0;
      font-size: 12.5px;
    }

    .section-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted);
      margin: 0 0 10px;
    }

    .items {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .item-card {
      display: grid;
      grid-template-columns: 84px 1fr 70px;
      gap: 14px;
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 12px 14px;
      page-break-inside: avoid;
    }

    .item-image {
      width: 84px;
      height: 84px;
      border-radius: 8px;
      border: 1px solid var(--line);
      background: var(--surface);
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      overflow: hidden;
    }

    .item-image img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .no-image {
      font-size: 9.5px;
      color: var(--muted);
      padding: 0 6px;
    }

    .image-warning {
      font-size: 9px;
      color: var(--brand);
      margin-top: 4px;
      font-weight: 600;
    }

    .item-heading {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
    }

    .item-index {
      font-size: 9.5px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .item-body h4 {
      margin: 2px 0 4px;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: -0.005em;
    }

    .item-body p {
      margin: 2px 0;
      font-size: 12px;
    }

    .item-spec {
      color: var(--ink);
    }

    .label {
      color: var(--muted);
      font-weight: 600;
    }

    .muted {
      color: var(--muted);
    }

    .alertas {
      margin: 6px 0 0;
      padding-left: 16px;
      color: #92400e;
      font-size: 11.5px;
    }

    .alertas li {
      margin-bottom: 2px;
    }

    .item-qty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      border-left: 1px solid var(--line);
      padding-left: 12px;
    }

    .qty-value {
      font-size: 20px;
      font-weight: 800;
      color: var(--brand);
      line-height: 1;
    }

    .qty-unit {
      font-size: 10.5px;
      color: var(--muted);
      text-transform: uppercase;
      margin-top: 2px;
    }

    .badge {
      display: inline-block;
      padding: 2px 9px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
      white-space: nowrap;
    }

    .badge-ok {
      background: #d1fae5;
      color: #065f46;
    }

    .badge-revisar {
      background: #fef3c7;
      color: #92400e;
    }

    .footer {
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1px solid var(--line);
      font-size: 10.5px;
      color: var(--muted);
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      ${renderLogo()}
      <div class="brand-sub">Casa Forte Construtora</div>
    </div>
    <div class="title">
      <h1>Pedido de Compra <span class="numero">#${pedido.numero}</span></h1>
      <div class="badges-row">
        <span class="pill">${escapeHtml(STATUS_LABELS[pedido.status])}</span>
        <span class="pill">${escapeHtml(PRIORIDADE_LABELS[pedido.prioridade])}</span>
      </div>
      <p class="meta">Gerado em ${new Date().toLocaleString('pt-BR')}</p>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-card">
      <h3>Obra</h3>
      <p><strong>${escapeHtml(obra?.nome || '-')}</strong></p>
      <p class="muted">${escapeHtml(obra?.endereco || 'Endereço não informado')}</p>
      <p class="muted">${escapeHtml([obra?.cidade, obra?.estado].filter(Boolean).join(' / ') || '')}</p>
      <p><span class="label">Necessidade:</span> ${formatDate(pedido.data_necessidade)}</p>
    </div>

    <div class="info-card">
      <h3>Solicitante / Responsável</h3>
      <p><span class="label">Solicitante:</span> ${escapeHtml(solicitante?.nome || '-')}</p>
      <p><span class="label">Engenheiro:</span> ${escapeHtml(engenheiro?.nome || '-')}</p>
      <p><span class="label">Criado em:</span> ${formatDate(pedido.created_at)}</p>
    </div>
  </div>

  ${
    itensComRevisao > 0
      ? `<div class="revisao-alert">⚠ ${itensComRevisao} item(ns) deste pedido precisam de revisão manual antes da compra.</div>`
      : ''
  }

  ${
    pedido.observacoes_gerais
      ? `
        <div class="observacoes">
          <h3>Observações gerais</h3>
          <p>${escapeHtml(pedido.observacoes_gerais)}</p>
        </div>
      `
      : ''
  }

  <p class="section-title">Itens do pedido (${itens.length})</p>
  <div class="items">
    ${cards}
  </div>

  <div class="footer">
    <div>
      Casa Forte Construtora<br />
      Pedido gerado automaticamente pelo sistema Casa Forte Compras.
    </div>
    <div>${new Date().toLocaleString('pt-BR')}</div>
  </div>
</body>
</html>
`
}
