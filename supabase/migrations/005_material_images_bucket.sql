insert into storage.buckets (id, name, public)
values ('material-images', 'material-images', true)
on conflict (id) do nothing;

create policy "material_images_staff_select"
on storage.objects for select
to authenticated
using (
  bucket_id = 'material-images'
  and public.current_profile_role() in ('admin', 'diretoria', 'compras', 'engenheiro')
);

create policy "material_images_staff_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'material-images'
  and public.current_profile_role() in ('admin', 'diretoria', 'compras', 'engenheiro')
);

create policy "material_images_staff_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'material-images'
  and public.current_profile_role() in ('admin', 'diretoria', 'compras')
)
with check (
  bucket_id = 'material-images'
  and public.current_profile_role() in ('admin', 'diretoria', 'compras')
);

create policy "material_images_staff_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'material-images'
  and public.current_profile_role() in ('admin', 'diretoria', 'compras')
);
