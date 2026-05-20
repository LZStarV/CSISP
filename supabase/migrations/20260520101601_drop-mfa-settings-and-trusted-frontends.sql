revoke delete on table "public"."mfa_settings" from "anon";

revoke insert on table "public"."mfa_settings" from "anon";

revoke references on table "public"."mfa_settings" from "anon";

revoke select on table "public"."mfa_settings" from "anon";

revoke trigger on table "public"."mfa_settings" from "anon";

revoke truncate on table "public"."mfa_settings" from "anon";

revoke update on table "public"."mfa_settings" from "anon";

revoke delete on table "public"."mfa_settings" from "authenticated";

revoke insert on table "public"."mfa_settings" from "authenticated";

revoke references on table "public"."mfa_settings" from "authenticated";

revoke select on table "public"."mfa_settings" from "authenticated";

revoke trigger on table "public"."mfa_settings" from "authenticated";

revoke truncate on table "public"."mfa_settings" from "authenticated";

revoke update on table "public"."mfa_settings" from "authenticated";

revoke delete on table "public"."mfa_settings" from "service_role";

revoke insert on table "public"."mfa_settings" from "service_role";

revoke references on table "public"."mfa_settings" from "service_role";

revoke select on table "public"."mfa_settings" from "service_role";

revoke trigger on table "public"."mfa_settings" from "service_role";

revoke truncate on table "public"."mfa_settings" from "service_role";

revoke update on table "public"."mfa_settings" from "service_role";

revoke delete on table "public"."trusted_frontends" from "anon";

revoke insert on table "public"."trusted_frontends" from "anon";

revoke references on table "public"."trusted_frontends" from "anon";

revoke select on table "public"."trusted_frontends" from "anon";

revoke trigger on table "public"."trusted_frontends" from "anon";

revoke truncate on table "public"."trusted_frontends" from "anon";

revoke update on table "public"."trusted_frontends" from "anon";

revoke delete on table "public"."trusted_frontends" from "authenticated";

revoke insert on table "public"."trusted_frontends" from "authenticated";

revoke references on table "public"."trusted_frontends" from "authenticated";

revoke select on table "public"."trusted_frontends" from "authenticated";

revoke trigger on table "public"."trusted_frontends" from "authenticated";

revoke truncate on table "public"."trusted_frontends" from "authenticated";

revoke update on table "public"."trusted_frontends" from "authenticated";

revoke delete on table "public"."trusted_frontends" from "service_role";

revoke insert on table "public"."trusted_frontends" from "service_role";

revoke references on table "public"."trusted_frontends" from "service_role";

revoke select on table "public"."trusted_frontends" from "service_role";

revoke trigger on table "public"."trusted_frontends" from "service_role";

revoke truncate on table "public"."trusted_frontends" from "service_role";

revoke update on table "public"."trusted_frontends" from "service_role";

alter table "public"."mfa_settings" drop constraint "mfa_settings_user_id_fkey";

alter table "public"."mfa_settings" drop constraint "mfa_settings_user_id_key";

alter table "public"."trusted_frontends" drop constraint "trusted_frontends_origin_key";

alter table "public"."mfa_settings" drop constraint "mfa_settings_pkey";

alter table "public"."trusted_frontends" drop constraint "trusted_frontends_pkey";

drop index if exists "public"."mfa_settings_pkey";

drop index if exists "public"."mfa_settings_user_id_key";

drop index if exists "public"."trusted_frontends_origin_key";

drop index if exists "public"."trusted_frontends_pkey";

drop table "public"."mfa_settings";

drop table "public"."trusted_frontends";

drop sequence if exists "public"."mfa_settings_id_seq";


