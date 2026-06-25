create extension if not exists "uuid-ossp";

create table public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  nome text not null,
  email text not null,
  telefone text,
  role text not null default 'visualizador',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_role_check check (
    role in ('admin', 'diretoria', 'compras', 'engenheiro', 'visualizador')
  )
);

create table public.obras (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  endereco text,
  cidade text,
  estado text,
  status text not null default 'ativa',
  responsavel_tecnico text,
  data_inicio date,
  previsao_termino date,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint obras_status_check check (
    status in ('ativa', 'pausada', 'concluida', 'arquivada')
  )
);

create table public.engenheiros (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references public.profiles(id) on delete set null,
  nome text not null,
  email text,
  telefone text,
  cargo text,
  registro_profissional text,
  assinatura_url text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.obra_engenheiros (
  id uuid primary key default uuid_generate_v4(),
  obra_id uuid references public.obras(id) on delete cascade not null,
  engenheiro_id uuid references public.engenheiros(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique (obra_id, engenheiro_id)
);

create table public.categorias_materiais (
  id uuid primary key default uuid_generate_v4(),
  nome text not null unique,
  descricao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.fornecedores (
  id uuid primary key default uuid_generate_v4(),
  nome_fantasia text not null,
  razao_social text,
  cnpj text,
  categoria_principal text,
  categorias_atendidas text[] default '{}',
  contato_principal text,
  telefone_whatsapp text,
  email text,
  cidade text,
  estado text,
  endereco text,
  observacoes text,
  fornecedor_principal boolean not null default false,
  status text not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fornecedores_status_check check (
    status in ('ativo', 'inativo', 'arquivado')
  )
);

create table public.materiais_catalogo (
  id uuid primary key default uuid_generate_v4(),
  nome_padronizado text not null,
  nome_normalizado text not null,
  categoria_id uuid references public.categorias_materiais(id) on delete set null,
  unidade_padrao text,
  descricao_padrao text,
  especificacao_padrao text,
  marcas_aceitas text[],
  observacoes text,
  ativo boolean not null default true,
  criado_por_ia boolean not null default false,
  aprovado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index materiais_catalogo_nome_normalizado_idx
on public.materiais_catalogo using gin (to_tsvector('portuguese', nome_normalizado));

create table public.material_images (
  id uuid primary key default uuid_generate_v4(),
  material_catalogo_id uuid references public.materiais_catalogo(id) on delete cascade,
  categoria_id uuid references public.categorias_materiais(id) on delete set null,
  nome_material text,
  image_url text not null,
  origem text not null default 'catalogo_interno',
  termos_busca text[] default '{}',
  aprovado boolean not null default false,
  principal boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),

  constraint material_images_origem_check check (
    origem in ('upload_manual', 'pedido_anterior', 'catalogo_interno', 'busca_ia', 'referencia_web', 'imagem_ilustrativa')
  )
);

create table public.pedidos_compra (
  id uuid primary key default uuid_generate_v4(),
  numero bigint generated always as identity,
  obra_id uuid references public.obras(id) on delete restrict not null,
  solicitante_id uuid references public.profiles(id) on delete set null,
  engenheiro_id uuid references public.engenheiros(id) on delete set null,
  status text not null default 'rascunho',
  prioridade text not null default 'normal',
  data_necessidade date,
  observacoes_gerais text,
  pdf_url text,
  enviado_em timestamptz,
  aprovado_por uuid references public.profiles(id) on delete set null,
  aprovado_em timestamptz,
  ia_preparado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint pedidos_compra_status_check check (
    status in (
      'rascunho',
      'pendente_revisao',
      'em_revisao',
      'pendente_aprovacao',
      'aprovado',
      'enviado',
      'respondido',
      'parcialmente_comprado',
      'comprado',
      'cancelado',
      'devolvido'
    )
  ),

  constraint pedidos_compra_prioridade_check check (
    prioridade in ('baixa', 'normal', 'alta', 'urgente')
  )
);

create table public.pedido_compra_itens (
  id uuid primary key default uuid_generate_v4(),
  pedido_compra_id uuid references public.pedidos_compra(id) on delete cascade not null,
  material_catalogo_id uuid references public.materiais_catalogo(id) on delete set null,
  categoria_id uuid references public.categorias_materiais(id) on delete set null,
  nome_material text not null,
  nome_padronizado text,
  descricao text,
  unidade text,
  quantidade numeric not null default 1,
  marca_preferencial text,
  especificacao_tecnica text,
  local_de_aplicacao text,
  observacoes text,
  imagem_referencia_url text,
  imagem_origem text,
  imagem_aprovada boolean not null default false,
  ia_resumo text,
  ia_termos_busca text[] default '{}',
  ia_alertas text[] default '{}',
  ia_confianca numeric,
  precisa_revisao boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint pedido_compra_itens_imagem_origem_check check (
    imagem_origem is null or imagem_origem in (
      'upload_engenheiro',
      'catalogo_interno',
      'busca_ia',
      'referencia_web',
      'imagem_ilustrativa'
    )
  )
);

create table public.aprovacoes_pedido (
  id uuid primary key default uuid_generate_v4(),
  pedido_compra_id uuid references public.pedidos_compra(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  acao text not null,
  comentario text,
  created_at timestamptz not null default now(),

  constraint aprovacoes_pedido_acao_check check (
    acao in (
      'criado',
      'enviado_revisao',
      'revisado',
      'enviado_aprovacao',
      'aprovado',
      'rejeitado',
      'devolvido',
      'enviado_whatsapp',
      'cancelado',
      'marcado_comprado',
      'pdf_gerado',
      'ia_preparado'
    )
  )
);

create table public.whatsapp_envios (
  id uuid primary key default uuid_generate_v4(),
  pedido_compra_id uuid references public.pedidos_compra(id) on delete cascade not null,
  fornecedor_id uuid references public.fornecedores(id) on delete set null,
  telefone text not null,
  mensagem text,
  status text not null default 'pending',
  whatsapp_message_id text,
  error_message text,
  enviado_em timestamptz,
  created_at timestamptz not null default now(),

  constraint whatsapp_envios_status_check check (
    status in ('pending', 'sent', 'failed', 'delivered', 'read')
  )
);

create table public.respostas_fornecedores (
  id uuid primary key default uuid_generate_v4(),
  pedido_compra_id uuid references public.pedidos_compra(id) on delete cascade not null,
  fornecedor_id uuid references public.fornecedores(id) on delete cascade not null,
  respondeu boolean not null default false,
  valor_total numeric,
  prazo_entrega text,
  condicao_pagamento text,
  observacoes text,
  anexo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activity_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create index pedidos_compra_obra_id_idx on public.pedidos_compra(obra_id);
create index pedidos_compra_status_idx on public.pedidos_compra(status);
create index pedido_compra_itens_pedido_idx on public.pedido_compra_itens(pedido_compra_id);
create index fornecedores_categorias_idx on public.fornecedores using gin(categorias_atendidas);
create index whatsapp_envios_pedido_idx on public.whatsapp_envios(pedido_compra_id);
