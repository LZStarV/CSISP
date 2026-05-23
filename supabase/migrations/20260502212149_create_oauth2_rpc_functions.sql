alter table "public"."oidc_clients" add column "backchannel_logout_uri" text;

alter table "public"."oidc_clients" add column "grant_types" jsonb default '["authorization_code"]'::jsonb;

alter table "public"."oidc_clients" add column "is_confidential" boolean not null default false;

alter table "public"."oidc_clients" add column "post_logout_redirect_uris" jsonb;

alter table "public"."oidc_clients" add column "token_endpoint_auth_method" text not null default 'none'::text;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.auth_revoke_all_user_tokens(p_user_id integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_sub_hash text;
  v_count integer;
begin
  -- 输入校验
  if p_user_id is null then
    raise exception 'auth_revoke_all_user_tokens: p_user_id must not be null';
  end if;

  -- 在数据库层计算 subject hash（与应用层 crypto.createHash('sha256').update(sub).digest('hex') 一致）
  v_sub_hash := encode(digest(p_user_id::text, 'sha256'), 'hex');

  -- 批量撤销该用户所有活跃的 Refresh Token
  update refresh_tokens
  set status = 'revoked'
  where sub_hash = v_sub_hash and status <> 'revoked';

  get diagnostics v_count = row_count;
  return v_count;
end;
$function$
;

ALTER FUNCTION public.auth_revoke_all_user_tokens(p_user_id integer) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.auth_revoke_all_user_tokens(p_user_id integer) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.oauth2_find_active_key()
 RETURNS TABLE(kid text, kty text, alg text, use text, public_pem text, private_pem_enc text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
begin
  return query
  select k.kid, k.kty, k.alg, k.use, k.public_pem, k.private_pem_enc
  from oidc_keys k
  where k.status = 'active'
  order by k.created_at desc
  limit 1;
end;
$function$
;

ALTER FUNCTION public.oauth2_find_active_key() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.oauth2_find_active_key() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.oauth2_find_userinfo_by_sub(p_sub text)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
declare
  v_result json;
begin
  -- 输入校验
  if p_sub is null then
    raise exception 'oauth2_find_userinfo_by_sub: p_sub must not be null';
  end if;

  select json_build_object(
    'sub', u.id::text,
    'preferred_username', u.student_id,
    'email_verified', false,
    'roles', u.roles,
    'student_id', u.student_id
  ) into v_result
  from "user" u
  where u.id = p_sub::integer;

  return v_result;
end;
$function$
;

ALTER FUNCTION public.oauth2_find_userinfo_by_sub(p_sub text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.oauth2_find_userinfo_by_sub(p_sub text) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.oauth2_rotate_refresh_token(p_client_id text, p_old_rt_id integer, p_new_rt_hash text, p_sub text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_new_id integer;
begin
  -- 输入校验
  if p_client_id is null or p_new_rt_hash is null or p_sub is null then
    raise exception 'oauth2_rotate_refresh_token: p_client_id, p_new_rt_hash, p_sub must not be null';
  end if;

  -- 原子操作：撤销旧 RT（仅当状态为 active 时才撤销，防止重复撤销）
  update refresh_tokens
  set status = 'revoked'
  where id = p_old_rt_id and status = 'active';

  -- 签发新 RT，关联旧 RT 的 prev_id
  insert into refresh_tokens (client_id, sub_hash, rt_hash, status, prev_id, created_at)
  values (p_client_id, p_sub, p_new_rt_hash, 'active', p_old_rt_id, now())
  returning id into v_new_id;

  return v_new_id;
end;
$function$
;

ALTER FUNCTION public.oauth2_rotate_refresh_token(p_client_id text, p_old_rt_id integer, p_new_rt_hash text, p_sub text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.oauth2_rotate_refresh_token(p_client_id text, p_old_rt_id integer, p_new_rt_hash text, p_sub text) FROM PUBLIC;


