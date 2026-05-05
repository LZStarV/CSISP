revoke delete on table "public"."oidc_clients" from "anon";

revoke insert on table "public"."oidc_clients" from "anon";

revoke references on table "public"."oidc_clients" from "anon";

revoke select on table "public"."oidc_clients" from "anon";

revoke trigger on table "public"."oidc_clients" from "anon";

revoke truncate on table "public"."oidc_clients" from "anon";

revoke update on table "public"."oidc_clients" from "anon";

revoke delete on table "public"."oidc_clients" from "authenticated";

revoke insert on table "public"."oidc_clients" from "authenticated";

revoke references on table "public"."oidc_clients" from "authenticated";

revoke select on table "public"."oidc_clients" from "authenticated";

revoke trigger on table "public"."oidc_clients" from "authenticated";

revoke truncate on table "public"."oidc_clients" from "authenticated";

revoke update on table "public"."oidc_clients" from "authenticated";

revoke delete on table "public"."oidc_clients" from "service_role";

revoke insert on table "public"."oidc_clients" from "service_role";

revoke references on table "public"."oidc_clients" from "service_role";

revoke select on table "public"."oidc_clients" from "service_role";

revoke trigger on table "public"."oidc_clients" from "service_role";

revoke truncate on table "public"."oidc_clients" from "service_role";

revoke update on table "public"."oidc_clients" from "service_role";

revoke delete on table "public"."oidc_keys" from "anon";

revoke insert on table "public"."oidc_keys" from "anon";

revoke references on table "public"."oidc_keys" from "anon";

revoke select on table "public"."oidc_keys" from "anon";

revoke trigger on table "public"."oidc_keys" from "anon";

revoke truncate on table "public"."oidc_keys" from "anon";

revoke update on table "public"."oidc_keys" from "anon";

revoke delete on table "public"."oidc_keys" from "authenticated";

revoke insert on table "public"."oidc_keys" from "authenticated";

revoke references on table "public"."oidc_keys" from "authenticated";

revoke select on table "public"."oidc_keys" from "authenticated";

revoke trigger on table "public"."oidc_keys" from "authenticated";

revoke truncate on table "public"."oidc_keys" from "authenticated";

revoke update on table "public"."oidc_keys" from "authenticated";

revoke delete on table "public"."oidc_keys" from "service_role";

revoke insert on table "public"."oidc_keys" from "service_role";

revoke references on table "public"."oidc_keys" from "service_role";

revoke select on table "public"."oidc_keys" from "service_role";

revoke trigger on table "public"."oidc_keys" from "service_role";

revoke truncate on table "public"."oidc_keys" from "service_role";

revoke update on table "public"."oidc_keys" from "service_role";

revoke delete on table "public"."refresh_tokens" from "anon";

revoke insert on table "public"."refresh_tokens" from "anon";

revoke references on table "public"."refresh_tokens" from "anon";

revoke select on table "public"."refresh_tokens" from "anon";

revoke trigger on table "public"."refresh_tokens" from "anon";

revoke truncate on table "public"."refresh_tokens" from "anon";

revoke update on table "public"."refresh_tokens" from "anon";

revoke delete on table "public"."refresh_tokens" from "authenticated";

revoke insert on table "public"."refresh_tokens" from "authenticated";

revoke references on table "public"."refresh_tokens" from "authenticated";

revoke select on table "public"."refresh_tokens" from "authenticated";

revoke trigger on table "public"."refresh_tokens" from "authenticated";

revoke truncate on table "public"."refresh_tokens" from "authenticated";

revoke update on table "public"."refresh_tokens" from "authenticated";

revoke delete on table "public"."refresh_tokens" from "service_role";

revoke insert on table "public"."refresh_tokens" from "service_role";

revoke references on table "public"."refresh_tokens" from "service_role";

revoke select on table "public"."refresh_tokens" from "service_role";

revoke trigger on table "public"."refresh_tokens" from "service_role";

revoke truncate on table "public"."refresh_tokens" from "service_role";

revoke update on table "public"."refresh_tokens" from "service_role";

drop function if exists "public"."auth_revoke_all_user_tokens"(p_user_id integer);

drop function if exists "public"."auth_revoke_client_rt"(p_client_id text, p_sub text);

drop function if exists "public"."auth_revoke_rt_by_sub"(p_sub text);

drop function if exists "public"."oauth2_find_active_key"();

drop function if exists "public"."oauth2_find_userinfo_by_sub"(p_sub text);

drop function if exists "public"."oauth2_rotate_refresh_token"(p_client_id text, p_old_rt_id integer, p_new_rt_hash text, p_sub text);

alter table "public"."oidc_clients" drop constraint "oidc_clients_pkey";

alter table "public"."oidc_keys" drop constraint "oidc_keys_pkey";

alter table "public"."refresh_tokens" drop constraint "refresh_tokens_pkey";

drop index if exists "public"."oidc_clients_pkey";

drop index if exists "public"."oidc_keys_pkey";

drop index if exists "public"."refresh_tokens_pkey";

drop table "public"."oidc_clients";

drop table "public"."oidc_keys";

drop table "public"."refresh_tokens";

drop sequence if exists "public"."refresh_tokens_id_seq";


