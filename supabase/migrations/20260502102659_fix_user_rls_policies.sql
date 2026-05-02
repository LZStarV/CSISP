
  create policy "Allow anon read"
  on "public"."user"
  as permissive
  for select
  to anon
using (true);



  create policy "Allow auth admin delete"
  on "public"."user"
  as permissive
  for delete
  to supabase_auth_admin
using (true);



  create policy "Allow auth admin insert"
  on "public"."user"
  as permissive
  for insert
  to supabase_auth_admin
with check (true);



  create policy "Allow auth admin update"
  on "public"."user"
  as permissive
  for update
  to supabase_auth_admin
using (true)
with check (true);



  create policy "Allow authenticated read"
  on "public"."user"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Allow service role full access"
  on "public"."user"
  as permissive
  for all
  to service_role
using (true)
with check (true);



