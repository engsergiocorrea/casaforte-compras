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

function renderItemRow(item: PedidoCompraItem) {
  const statusBadge = item.precisa_revisao
    ? '<span class="badge badge-revisar">Revisar</span>'
    : '<span class="badge badge-ok">OK</span>'

  const alertas =
    item.ia_alertas && item.ia_alertas.length > 0
      ? `<ul class="alertas">${item.ia_alertas
          .map((alerta) => `<li>${escapeHtml(alerta)}</li>`)
          .join('')}</ul>`
      : ''

  return `
    <tr>
      <td class="image-cell">${renderItemImage(item)}</td>
      <td>
        <strong>${escapeHtml(item.nome_padronizado || item.nome_material)}</strong>
        ${
          item.nome_padronizado && item.nome_padronizado !== item.nome_material
            ? `<br/><small class="muted">Original: ${escapeHtml(item.nome_material)}</small>`
            : ''
        }
        ${
          item.especificacao_tecnica
            ? `<br/><small>${escapeHtml(item.especificacao_tecnica)}</small>`
            : ''
        }
        ${alertas}
      </td>
      <td>${item.quantidade}</td>
      <td>${escapeHtml(item.unidade || '-')}</td>
      <td>${escapeHtml(item.marca_preferencial || '-')}</td>
      <td>${escapeHtml(item.local_de_aplicacao || '-')}</td>
      <td>${escapeHtml(item.observacoes || '-')}</td>
      <td class="status-cell">${statusBadge}</td>
    </tr>
  `
}

export function generatePurchaseOrderHtml(data: PurchaseOrderHtmlData) {
  const { pedido, obra, solicitante, engenheiro, itens } = data

  const itensComRevisao = itens.filter((item) => item.precisa_revisao).length

  const rows = itens.map(renderItemRow).join('')

  return `
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Pedido de Compra ${pedido.numero}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      color: #1E1E1E;
      margin: 32px;
      background: #fff;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 4px solid #E8390E;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }

    .brand {
      font-size: 26px;
      font-weight: 800;
      color: #E8390E;
    }

    .title {
      text-align: right;
    }

    .title h1 {
      margin: 0;
      font-size: 24px;
    }

    .title p {
      margin: 4px 0;
      font-size: 13px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 24px;
    }

    .info-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 12px;
      background: #F7F7F7;
    }

    .info-card h3 {
      margin: 0 0 8px;
      font-size: 14px;
      color: #E8390E;
    }

    .info-card p {
      margin: 4px 0;
      font-size: 13px;
    }

    .revisao-alert {
      margin-bottom: 16px;
      padding: 10px 14px;
      border-radius: 8px;
      background: #FEF3C7;
      border: 1px solid #FCD34D;
      color: #92400E;
      font-size: 13px;
      font-weight: bold;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    th {
      background: #1E1E1E;
      color: white;
      text-align: left;
      padding: 8px;
    }

    td {
      border: 1px solid #ddd;
      padding: 8px;
      vertical-align: top;
    }

    .image-cell {
      width: 90px;
      text-align: center;
    }

    .image-cell img {
      max-width: 80px;
      max-height: 80px;
      object-fit: contain;
    }

    .no-image {
      font-size: 10px;
      color: #888;
    }

    .image-warning {
      font-size: 9px;
      color: #E8390E;
      margin-top: 4px;
    }

    .muted {
      color: #666;
    }

    .alertas {
      margin: 4px 0 0;
      padding-left: 16px;
      color: #b45309;
    }

    .status-cell {
      text-align: center;
    }

    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: bold;
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
      margin-top: 32px;
      padding-top: 12px;
      border-top: 1px solid #ddd;
      font-size: 11px;
      color: #555;
      display: flex;
      justify-content: space-between;
    }

    .observacoes {
      margin-top: 24px;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 12px;
    }

    .observacoes h3 {
      margin-top: 0;
      color: #E8390E;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Casa Forte</div>
      <div>Incorporadora / Construtora</div>
    </div>
    <div class="title">
      <h1>Pedido de Compra</h1>
      <p><strong>Pedido nº:</strong> ${pedido.numero}</p>
      <p><strong>Status:</strong> ${STATUS_LABELS[pedido.status]}</p>
      <p><strong>Prioridade:</strong> ${PRIORIDADE_LABELS[pedido.prioridade]}</p>
      <p><strong>Criado em:</strong> ${formatDate(pedido.created_at)}</p>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-card">
      <h3>Obra</h3>
      <p><strong>${escapeHtml(obra?.nome || '-')}</strong></p>
      <p>${escapeHtml(obra?.endereco || 'Endereço não informado')}</p>
      <p>${escapeHtml([obra?.cidade, obra?.estado].filter(Boolean).join(' / ') || '')}</p>
    </div>

    <div class="info-card">
      <h3>Responsáveis</h3>
      <p><strong>Solicitante:</strong> ${escapeHtml(solicitante?.nome || '-')}</p>
      <p><strong>Engenheiro:</strong> ${escapeHtml(engenheiro?.nome || '-')}</p>
      <p><strong>Necessidade:</strong> ${formatDate(pedido.data_necessidade)}</p>
    </div>
  </div>

  ${
    itensComRevisao > 0
      ? `<div class="revisao-alert">⚠ ${itensComRevisao} item(ns) deste pedido precisam de revisão manual antes da compra.</div>`
      : ''
  }

  <table>
    <thead>
      <tr>
        <th>Imagem</th>
        <th>Material / Especificação</th>
        <th>Qtd.</th>
        <th>Un.</th>
        <th>Marca</th>
        <th>Aplicação</th>
        <th>Obs.</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  ${
    pedido.observacoes_gerais
      ? `
        <div class="observacoes">
          <h3>Observações Gerais</h3>
          <p>${escapeHtml(pedido.observacoes_gerais)}</p>
        </div>
      `
      : ''
  }

  <div class="footer">
    <div>
      Casa Forte Incorporadora / Construtora — Pedido gerado automaticamente pelo sistema Casa
      Forte Compras.
    </div>
    <div>${new Date().toLocaleString('pt-BR')}</div>
  </div>
</body>
</html>
`
}
