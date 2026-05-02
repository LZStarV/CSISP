alter table "public"."oidc_clients" enable row level security;

alter table "public"."oidc_keys" enable row level security;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$DECLARE
  v_student_id TEXT;
BEGIN
  -- 检查邮箱验证状态变化
  IF OLD.email_confirmed_at IS NULL
     AND NEW.email_confirmed_at IS NOT NULL THEN

    -- 从 metadata 获取学号
    v_student_id := NEW.raw_user_meta_data->>'student_id';

    -- 如果没有学号，跳过
    IF v_student_id IS NULL OR v_student_id = '' THEN
      RETURN NEW;
    END IF;

    -- 创建 public.user 记录
    INSERT INTO public.user (
      student_id,
      auth_user_id,
      enrollment_year,
      major,
      status,
      roles
    ) VALUES (
      v_student_id,
      NEW.id,
      (NEW.raw_user_meta_data->>'enrollment_year')::INTEGER,
      NEW.raw_user_meta_data->>'major',
      1,
      '[]'::JSONB
    );
  END IF;

  RETURN NEW;
END;$function$
;

grant delete on table "public"."user" to "supabase_auth_admin";

grant insert on table "public"."user" to "supabase_auth_admin";

grant references on table "public"."user" to "supabase_auth_admin";

grant select on table "public"."user" to "supabase_auth_admin";

grant trigger on table "public"."user" to "supabase_auth_admin";

grant truncate on table "public"."user" to "supabase_auth_admin";

grant update on table "public"."user" to "supabase_auth_admin";

CREATE TRIGGER on_auth_user_email_confirmed AFTER UPDATE ON auth.users FOR EACH ROW WHEN (((old.email_confirmed_at IS NULL) AND (new.email_confirmed_at IS NOT NULL))) EXECUTE FUNCTION public.handle_user_email_confirmed();

REVOKE EXECUTE ON FUNCTION public.handle_user_email_confirmed FROM anon, authenticated, public;
