alter table public.profiles enable row level security;
alter table public.obras enable row level security;
alter table public.engenheiros enable row level security;
alter table public.obra_engenheiros enable row level security;
alter table public.categorias_materiais enable row level security;
alter table public.fornecedores enable row level security;
alter table public.materiais_catalogo enable row level security;
alter table public.material_images enable row level security;
alter table public.pedidos_compra enable row level security;
alter table public.pedido_compra_itens enable row level security;
alter table public.aprovacoes_pedido enable row level security;
alter table public.whatsapp_envios enable row level security;
alter table public.respostas_fornecedores enable row level security;
alter table public.activity_logs enable row level security;

create or replace function public.current_profile_role()
returns text
language sql
security definer
set search_path = public
as $$
  select role from public.profiles where user_id = auth.uid() and ativo = true limit 1;
$$;

create or replace function public.current_profile_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select id from public.profiles where user_id = auth.uid() and ativo = true limit 1;
$$;

create or replace function public.is_admin_or_staff()
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.current_profile_role() in ('admin', 'diretoria', 'compras');
$$;

create policy "profiles_select_authenticated"
on public.profiles for select
to authenticated
using (true);

create policy "profiles_update_own_or_admin"
on public.profiles for update
to authenticated
using (
  user_id = auth.uid()
  or public.current_profile_role() = 'admin'
);

create policy "admin_insert_profiles"
on public.profiles for insert
to authenticated
with check (public.current_profile_role() = 'admin');

create policy "obras_select_authenticated"
on public.obras for select
to authenticated
using (true);

create policy "obras_staff_write"
on public.obras for all
to authenticated
using (public.current_profile_role() in ('admin', 'diretoria', 'compras'))
with check (public.current_profile_role() in ('admin', 'diretoria', 'compras'));

create policy "engenheiros_select_authenticated"
on public.engenheiros for select
to authenticated
using (true);

create policy "engenheiros_staff_write"
on public.engenheiros for all
to authenticated
using (public.current_profile_role() in ('admin', 'diretoria', 'compras'))
with check (public.current_profile_role() in ('admin', 'diretoria', 'compras'));

create policy "obra_engenheiros_select_authenticated"
on public.obra_engenheiros for select
to authenticated
using (true);

create policy "obra_engenheiros_staff_write"
on public.obra_engenheiros for all
to authenticated
using (public.current_profile_role() in ('admin', 'diretoria', 'compras'))
with check (public.current_profile_role() in ('admin', 'diretoria', 'compras'));

create policy "categorias_select_authenticated"
on public.categorias_materiais for select
to authenticated
using (true);

create policy "categorias_staff_write"
on public.categorias_materiais for all
to authenticated
using (public.current_profile_role() in ('admin', 'diretoria', 'compras'))
with check (public.current_profile_role() in ('admin', 'diretoria', 'compras'));

create policy "fornecedores_select_authenticated"
on public.fornecedores for select
to authenticated
using (true);

create policy "fornecedores_staff_write"
on public.fornecedores for all
to authenticated
using (public.current_profile_role() in ('admin', 'diretoria', 'compras'))
with check (public.current_profile_role() in ('admin', 'diretoria', 'compras'));

create policy "materiais_catalogo_select_authenticated"
on public.materiais_catalogo for select
to authenticated
using (true);

create policy "materiais_catalogo_staff_write"
on public.materiais_catalogo for all
to authenticated
using (public.current_profile_role() in ('admin', 'diretoria', 'compras', 'engenheiro'))
with check (public.current_profile_role() in ('admin', 'diretoria', 'compras', 'engenheiro'));

create policy "material_images_select_authenticated"
on public.material_images for select
to authenticated
using (true);

create policy "material_images_insert_authenticated"
on public.material_images for insert
to authenticated
with check (auth.uid() is not null);

create policy "material_images_staff_update"
on public.material_images for update
to authenticated
using (public.current_profile_role() in ('admin', 'diretoria', 'compras'))
with check (public.current_profile_role() in ('admin', 'diretoria', 'compras'));

create policy "pedidos_select_rule"
on public.pedidos_compra for select
to authenticated
using (
  public.is_admin_or_staff()
  or solicitante_id = public.current_profile_id()
  or engenheiro_id in (
    select e.id
    from public.engenheiros e
    where e.profile_id = public.current_profile_id()
  )
);

create policy "pedidos_insert_authenticated"
on public.pedidos_compra for insert
to authenticated
with check (auth.uid() is not null);

create policy "pedidos_update_rule"
on public.pedidos_compra for update
to authenticated
using (
  public.is_admin_or_staff()
  or (
    solicitante_id = public.current_profile_id()
    and status in ('rascunho', 'devolvido')
  )
)
with check (
  public.is_admin_or_staff()
  or (
    solicitante_id = public.current_profile_id()
    and status in ('rascunho', 'pendente_revisao', 'devolvido')
  )
);

create policy "itens_select_authenticated"
on public.pedido_compra_itens for select
to authenticated
using (
  exists (
    select 1
    from public.pedidos_compra p
    where p.id = pedido_compra_id
  )
);

create policy "itens_write_authenticated"
on public.pedido_compra_itens for all
to authenticated
using (
  exists (
    select 1
    from public.pedidos_compra p
    where p.id = pedido_compra_id
    and (
      public.is_admin_or_staff()
      or (
        p.solicitante_id = public.current_profile_id()
        and p.status in ('rascunho', 'devolvido')
      )
    )
  )
)
with check (
  exists (
    select 1
    from public.pedidos_compra p
    where p.id = pedido_compra_id
    and (
      public.is_admin_or_staff()
      or (
        p.solicitante_id = public.current_profile_id()
        and p.status in ('rascunho', 'devolvido')
      )
    )
  )
);

create policy "aprovacoes_select_authenticated"
on public.aprovacoes_pedido for select
to authenticated
using (true);

create policy "aprovacoes_insert_authenticated"
on public.aprovacoes_pedido for insert
to authenticated
with check (auth.uid() is not null);

create policy "whatsapp_select_staff"
on public.whatsapp_envios for select
to authenticated
using (public.current_profile_role() in ('admin', 'diretoria', 'compras'));

create policy "whatsapp_insert_staff"
on public.whatsapp_envios for insert
to authenticated
with check (public.current_profile_role() in ('admin', 'compras'));

create policy "respostas_select_staff"
on public.respostas_fornecedores for select
to authenticated
using (public.current_profile_role() in ('admin', 'diretoria', 'compras'));

create policy "respostas_write_staff"
on public.respostas_fornecedores for all
to authenticated
using (public.current_profile_role() in ('admin', 'diretoria', 'compras'))
with check (public.current_profile_role() in ('admin', 'diretoria', 'compras'));

create policy "logs_select_staff"
on public.activity_logs for select
to authenticated
using (public.current_profile_role() in ('admin', 'diretoria', 'compras'));

create policy "logs_insert_authenticated"
on public.activity_logs for insert
to authenticated
with check (auth.uid() is not null);
