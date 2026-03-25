alter table "public"."user" drop constraint "user_email_key";

alter table "public"."user" drop constraint "user_phone_key";

alter table "public"."user" drop constraint "user_username_key";

drop index if exists "public"."user_email_key";

drop index if exists "public"."user_phone_key";

drop index if exists "public"."user_username_key";

alter table "public"."user" drop column "created_at";

alter table "public"."user" drop column "email";

alter table "public"."user" drop column "password";

alter table "public"."user" drop column "phone";

alter table "public"."user" drop column "real_name";

alter table "public"."user" drop column "updated_at";

alter table "public"."user" drop column "username";

alter table "public"."user" drop column "weak_password_flag";

alter table "public"."user" alter column "enrollment_year" drop not null;

alter table "public"."user" alter column "major" drop not null;

alter table "public"."user" alter column "roles" drop not null;

alter table "public"."user" alter column "status" drop not null;

set check_function_bodies = off;
