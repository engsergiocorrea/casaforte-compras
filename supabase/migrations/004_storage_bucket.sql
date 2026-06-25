insert into storage.buckets (id, name, public)
values ('purchase-orders', 'purchase-orders', false)
on conflict (id) do nothing;

create policy "purchase_orders_staff_select"
on storage.objects for select
to authenticated
using (
  bucket_id = 'purchase-orders'
  and public.current_profile_role() in ('admin', 'diretoria', 'compras', 'engenheiro')
);

create policy "purchase_orders_staff_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'purchase-orders'
  and public.current_profile_role() in ('admin', 'diretoria', 'compras', 'engenheiro')
);

create policy "purchase_orders_staff_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'purchase-orders'
  and public.current_profile_role() in ('admin', 'diretoria', 'compras')
)
with check (
  bucket_id = 'purchase-orders'
  and public.current_profile_role() in ('admin', 'diretoria', 'compras')
);

create policy "purchase_orders_staff_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'purchase-orders'
  and public.current_profile_role() in ('admin', 'diretoria', 'compras')
);
