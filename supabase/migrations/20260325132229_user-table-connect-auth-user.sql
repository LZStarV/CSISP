drop function if exists "public"."bff_get_trusted_frontends"();

alter table "public"."user" add column "auth_user_id" uuid;

CREATE UNIQUE INDEX user_auth_user_id_key ON public."user" USING btree (auth_user_id);

alter table "public"."user" add constraint "user_auth_fk" FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user" validate constraint "user_auth_fk";

alter table "public"."user" add constraint "user_auth_user_id_key" UNIQUE using index "user_auth_user_id_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.bff_get_trusted_frontends_duplicate()
 RETURNS json
 LANGUAGE plpgsql
 STABLE
AS $function$declare
  v json;
begin
  select coalesce(json_agg(origin order by origin), '[]'::json)
    into v
  from public.trusted_frontends
  where enabled is true;
  return v;
end$function$
;

grant delete on table "public"."trusted_frontends" to "postgres";

grant insert on table "public"."trusted_frontends" to "postgres";

grant references on table "public"."trusted_frontends" to "postgres";

grant select on table "public"."trusted_frontends" to "postgres";

grant trigger on table "public"."trusted_frontends" to "postgres";

grant truncate on table "public"."trusted_frontends" to "postgres";

grant update on table "public"."trusted_frontends" to "postgres";


