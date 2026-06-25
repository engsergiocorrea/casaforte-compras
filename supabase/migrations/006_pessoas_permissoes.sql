-- Fluxo de aprovação simplificado + cadastro de pessoas e permissões granulares.
-- Não altera nem remove nenhum valor existente de enum/check constraint.

-- 1-3. Novos campos informativos em profiles.
alter table public.profiles add column if not exists cargo text;
alter table public.profiles add column if not exists observacoes text;
alter table public.profiles add column if not exists perfis_gerais text[] not null default '{}';

alter table public.profiles drop constraint if exists profiles_perfis_gerais_check;
alter table public.profiles add constraint profiles_perfis_gerais_check check (
  perfis_gerais <@ array[
    'diretor_geral',
    'diretor_financeiro',
    'financeiro',
    'engenheiro',
    'obras',
    'compras',
    'rdo',
    'tabelas',
    'administrador'
  ]::text[]
);

-- 4. Fornecedor padrão do pedido (selecionado antes/durante a aprovação).
alter table public.pedidos_compra add column if not exists fornecedor_id uuid references public.fornecedores(id);

-- 5. Permissões granulares por módulo, preparando o sistema para Portal
-- Central / RDO / Tabelas futuros, sem implementar essas áreas agora.
create table if not exists public.user_permissions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  module text not null,
  permission text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, module, permission)
);

create index if not exists user_permissions_profile_id_idx on public.user_permissions(profile_id);

-- 6. RLS em user_permissions.
alter table public.user_permissions enable row level security;

drop policy if exists "user_permissions_select_own_or_staff" on public.user_permissions;
create policy "user_permissions_select_own_or_staff"
on public.user_permissions for select
to authenticated
using (
  profile_id = public.current_profile_id()
  or public.current_profile_role() in ('admin', 'diretoria')
);

drop policy if exists "user_permissions_write_staff" on public.user_permissions;
create policy "user_permissions_write_staff"
on public.user_permissions for all
to authenticated
using (public.current_profile_role() in ('admin', 'diretoria'))
with check (public.current_profile_role() in ('admin', 'diretoria'));

-- 7. Reforço de RLS em profiles: a policy "profiles_update_own_or_admin"
-- existente permite que o próprio usuário atualize sua linha (sem with check,
-- então em teoria um usuário comum poderia até alterar sua própria role) OU
-- que um admin atualize qualquer linha. Isso é amplo demais para o requisito
-- novo ("usuário comum não pode alterar sua própria role/perfis_gerais, e só
-- admin/diretoria podem editar pessoas"). Em vez de bloquear todo update do
-- próprio usuário (o que quebraria casos legítimos como o usuário corrigir
-- seu próprio telefone), usamos um trigger que impede usuários não-staff de
-- alterar role/perfis_gerais/ativo/cargo de si mesmos ou de terceiros, e
-- mantemos duas policies de update: uma para admin/diretoria (sem
-- restrição) e uma para o próprio usuário (campos de uso pessoal).
create or replace function public.guard_profiles_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_profile_role() in ('admin', 'diretoria') then
    return new;
  end if;

  -- Usuário comum: só pode atualizar a própria linha, e não pode alterar
  -- role, perfis_gerais, cargo nem ativo (campos sensíveis de gestão de
  -- pessoas/permissões).
  if old.user_id <> auth.uid() then
    raise exception 'Apenas admin/diretoria podem alterar o perfil de outras pessoas';
  end if;

  if new.role is distinct from old.role
     or new.perfis_gerais is distinct from old.perfis_gerais
     or new.cargo is distinct from old.cargo
     or new.ativo is distinct from old.ativo then
    raise exception 'Apenas admin/diretoria podem alterar role, perfis_gerais, cargo ou ativo';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_profiles_update_trigger on public.profiles;
create trigger guard_profiles_update_trigger
before update on public.profiles
for each row
execute function public.guard_profiles_update();

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_staff"
on public.profiles for update
to authenticated
using (
  user_id = auth.uid()
  or public.current_profile_role() in ('admin', 'diretoria')
);

-- Mantém o insert restrito a admin (convite de pessoa também passa por
-- supabase.auth.admin.inviteUserByEmail no server, que usa a service role e
-- portanto não é afetado por RLS; esta policy cobre inserts diretos via
-- client autenticado, se algum dia existirem).
drop policy if exists "admin_insert_profiles" on public.profiles;
create policy "admin_insert_profiles"
on public.profiles for insert
to authenticated
with check (public.current_profile_role() in ('admin', 'diretoria'));
