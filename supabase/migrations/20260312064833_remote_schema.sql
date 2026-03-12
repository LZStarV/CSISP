


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS '标准公共模式';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."auth_issue_refresh_token"("p_client_id" "text", "p_sub" "text", "p_rt_hash" "text", "p_prev_id" integer) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$declare v_id int;
begin
  insert into refresh_tokens (
    client_id,
    sub_hash,
    rt_hash,
    status,
    prev_id,
    created_at
  )
  values (
    p_client_id,
    p_sub,
    p_rt_hash,
    'active',
    p_prev_id,
    now()
  )
  returning id into v_id;

  return v_id;
end$$;


ALTER FUNCTION "public"."auth_issue_refresh_token"("p_client_id" "text", "p_sub" "text", "p_rt_hash" "text", "p_prev_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_mark_rt_used"("p_id" bigint, "p_used_at" timestamp without time zone) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$begin
  update refresh_tokens
  set last_used_at = p_used_at
  where id = p_id;
  return;
end$$;


ALTER FUNCTION "public"."auth_mark_rt_used"("p_id" bigint, "p_used_at" timestamp without time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_reset_password"("p_student_id" "text", "p_new_hash" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$begin
  update "user"
  set password = p_new_hash
  where student_id = p_student_id;
  return;
end$$;


ALTER FUNCTION "public"."auth_reset_password"("p_student_id" "text", "p_new_hash" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_revoke_client_rt"("p_client_id" "text", "p_sub" "text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$declare v_cnt int;
begin
  update refresh_tokens
  set status = 'revoked'
  where client_id = p_client_id and sub_hash = p_sub and status <> 'revoked';
  get diagnostics v_cnt = row_count;
  return v_cnt;
end$$;


ALTER FUNCTION "public"."auth_revoke_client_rt"("p_client_id" "text", "p_sub" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_revoke_rt_by_id"("p_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$begin
  update refresh_tokens
  set status = 'revoked'
  where id = p_id;
  return;
end$$;


ALTER FUNCTION "public"."auth_revoke_rt_by_id"("p_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_revoke_rt_by_sub"("p_sub" "text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$declare v_cnt int;
begin
  update refresh_tokens
  set status = 'revoked'
  where sub_hash = p_sub and status <> 'revoked';
  get diagnostics v_cnt = row_count;
  return v_cnt;
end$$;


ALTER FUNCTION "public"."auth_revoke_rt_by_sub"("p_sub" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."academic_config" (
    "id" integer NOT NULL,
    "year" character varying(10) NOT NULL,
    "semester" integer NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "is_current" boolean DEFAULT false NOT NULL,
    "status" integer DEFAULT 1 NOT NULL
);


ALTER TABLE "public"."academic_config" OWNER TO "postgres";


COMMENT ON TABLE "public"."academic_config" IS '学期教学配置：定义学年、学期及其起止日期';



COMMENT ON COLUMN "public"."academic_config"."id" IS '主键 ID';



COMMENT ON COLUMN "public"."academic_config"."year" IS '学年（如 2023-2024）';



COMMENT ON COLUMN "public"."academic_config"."semester" IS '学期（1-第一学期，2-第二学期）';



COMMENT ON COLUMN "public"."academic_config"."start_date" IS '学期开始日期';



COMMENT ON COLUMN "public"."academic_config"."end_date" IS '学期结束日期';



COMMENT ON COLUMN "public"."academic_config"."is_current" IS '是否为当前学期';



COMMENT ON COLUMN "public"."academic_config"."status" IS '状态（1 正常）';



CREATE SEQUENCE IF NOT EXISTS "public"."academic_config_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."academic_config_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."academic_config_id_seq" OWNED BY "public"."academic_config"."id";



CREATE TABLE IF NOT EXISTS "public"."attendance_record" (
    "id" integer NOT NULL,
    "task_id" integer NOT NULL,
    "user_id" integer NOT NULL,
    "checkin_time" timestamp with time zone NOT NULL,
    "status" character varying(50) DEFAULT 'present'::character varying NOT NULL,
    "ip_address" character varying(50),
    "device_info" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."attendance_record" OWNER TO "postgres";


COMMENT ON TABLE "public"."attendance_record" IS '考勤签到记录：记录用户针对某考勤任务的签到结果';



COMMENT ON COLUMN "public"."attendance_record"."id" IS '主键 ID';



COMMENT ON COLUMN "public"."attendance_record"."task_id" IS '关联考勤任务 ID';



COMMENT ON COLUMN "public"."attendance_record"."user_id" IS '关联用户 ID';



COMMENT ON COLUMN "public"."attendance_record"."checkin_time" IS '签到时间';



COMMENT ON COLUMN "public"."attendance_record"."status" IS '签到状态（present-出勤，late-迟到，absent-缺勤）';



COMMENT ON COLUMN "public"."attendance_record"."ip_address" IS '签到时的 IP 地址';



COMMENT ON COLUMN "public"."attendance_record"."device_info" IS '签到设备信息';



COMMENT ON COLUMN "public"."attendance_record"."created_at" IS '创建时间';



COMMENT ON COLUMN "public"."attendance_record"."updated_at" IS '更新时间';



CREATE SEQUENCE IF NOT EXISTS "public"."attendance_record_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."attendance_record_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."attendance_record_id_seq" OWNED BY "public"."attendance_record"."id";



CREATE TABLE IF NOT EXISTS "public"."attendance_task" (
    "id" integer NOT NULL,
    "course_id" integer NOT NULL,
    "title" character varying(255) NOT NULL,
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "code" character varying(10),
    "status" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."attendance_task" OWNER TO "postgres";


COMMENT ON TABLE "public"."attendance_task" IS '考勤任务：定义某节课或某次活动的考勤规则';



COMMENT ON COLUMN "public"."attendance_task"."id" IS '主键 ID';



COMMENT ON COLUMN "public"."attendance_task"."course_id" IS '关联课程 ID';



COMMENT ON COLUMN "public"."attendance_task"."title" IS '考勤标题';



COMMENT ON COLUMN "public"."attendance_task"."start_time" IS '允许签到开始时间';



COMMENT ON COLUMN "public"."attendance_task"."end_time" IS '允许签到结束时间';



COMMENT ON COLUMN "public"."attendance_task"."code" IS '签到码（可选）';



COMMENT ON COLUMN "public"."attendance_task"."status" IS '任务状态（1 开启，0 关闭）';



COMMENT ON COLUMN "public"."attendance_task"."created_at" IS '创建时间';



COMMENT ON COLUMN "public"."attendance_task"."updated_at" IS '更新时间';



CREATE SEQUENCE IF NOT EXISTS "public"."attendance_task_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."attendance_task_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."attendance_task_id_seq" OWNED BY "public"."attendance_task"."id";



CREATE TABLE IF NOT EXISTS "public"."class" (
    "id" integer NOT NULL,
    "course_id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "code" character varying(50) NOT NULL,
    "capacity" integer DEFAULT 0 NOT NULL,
    "status" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."class" OWNER TO "postgres";


COMMENT ON TABLE "public"."class" IS '教学班级表：定义某门课程下的具体教学班';



COMMENT ON COLUMN "public"."class"."id" IS '主键 ID';



COMMENT ON COLUMN "public"."class"."course_id" IS '所属课程 ID';



COMMENT ON COLUMN "public"."class"."name" IS '班级名称';



COMMENT ON COLUMN "public"."class"."code" IS '班级代码（唯一）';



COMMENT ON COLUMN "public"."class"."capacity" IS '班级容量';



COMMENT ON COLUMN "public"."class"."status" IS '状态（1 正常）';



COMMENT ON COLUMN "public"."class"."created_at" IS '创建时间';



COMMENT ON COLUMN "public"."class"."updated_at" IS '更新时间';



CREATE SEQUENCE IF NOT EXISTS "public"."class_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."class_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."class_id_seq" OWNED BY "public"."class"."id";



CREATE TABLE IF NOT EXISTS "public"."course" (
    "id" integer NOT NULL,
    "course_code" character varying(50) NOT NULL,
    "course_name" character varying(255) NOT NULL,
    "semester" integer NOT NULL,
    "academic_year" integer NOT NULL,
    "available_majors" "jsonb",
    "description" "text",
    "credit" numeric(3,1) DEFAULT 0 NOT NULL,
    "department" character varying(255),
    "status" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."course" OWNER TO "postgres";


COMMENT ON TABLE "public"."course" IS '课程基本信息表：记录全校课程的基础元数据';



COMMENT ON COLUMN "public"."course"."id" IS '主键 ID';



COMMENT ON COLUMN "public"."course"."course_code" IS '课程代码（唯一）';



COMMENT ON COLUMN "public"."course"."course_name" IS '课程名称';



COMMENT ON COLUMN "public"."course"."semester" IS '学期';



COMMENT ON COLUMN "public"."course"."academic_year" IS '学年';



COMMENT ON COLUMN "public"."course"."available_majors" IS '适用专业';



COMMENT ON COLUMN "public"."course"."description" IS '课程描述';



COMMENT ON COLUMN "public"."course"."credit" IS '学分';



COMMENT ON COLUMN "public"."course"."department" IS '开课单位';



COMMENT ON COLUMN "public"."course"."status" IS '状态（1 正常）';



COMMENT ON COLUMN "public"."course"."created_at" IS '创建时间';



COMMENT ON COLUMN "public"."course"."updated_at" IS '更新时间';



CREATE SEQUENCE IF NOT EXISTS "public"."course_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."course_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."course_id_seq" OWNED BY "public"."course"."id";



CREATE TABLE IF NOT EXISTS "public"."course_rep" (
    "id" integer NOT NULL,
    "class_id" integer NOT NULL,
    "user_id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."course_rep" OWNER TO "postgres";


COMMENT ON TABLE "public"."course_rep" IS '课代表管理：记录班级的学生课代表信息';



COMMENT ON COLUMN "public"."course_rep"."id" IS '主键 ID';



COMMENT ON COLUMN "public"."course_rep"."class_id" IS '关联班级 ID';



COMMENT ON COLUMN "public"."course_rep"."user_id" IS '关联用户 ID';



COMMENT ON COLUMN "public"."course_rep"."created_at" IS '创建时间';



COMMENT ON COLUMN "public"."course_rep"."updated_at" IS '更新时间';



CREATE SEQUENCE IF NOT EXISTS "public"."course_rep_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."course_rep_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."course_rep_id_seq" OWNED BY "public"."course_rep"."id";



CREATE TABLE IF NOT EXISTS "public"."course_teacher" (
    "id" integer NOT NULL,
    "class_id" integer NOT NULL,
    "teacher_id" integer NOT NULL,
    "is_primary" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."course_teacher" OWNER TO "postgres";


COMMENT ON TABLE "public"."course_teacher" IS '课程教师关联：记录班级与任课教师的多对多关系';



COMMENT ON COLUMN "public"."course_teacher"."id" IS '主键 ID';



COMMENT ON COLUMN "public"."course_teacher"."class_id" IS '关联班级 ID';



COMMENT ON COLUMN "public"."course_teacher"."teacher_id" IS '关联教师 ID';



COMMENT ON COLUMN "public"."course_teacher"."is_primary" IS '是否为主讲教师';



COMMENT ON COLUMN "public"."course_teacher"."created_at" IS '创建时间';



COMMENT ON COLUMN "public"."course_teacher"."updated_at" IS '更新时间';



CREATE SEQUENCE IF NOT EXISTS "public"."course_teacher_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."course_teacher_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."course_teacher_id_seq" OWNED BY "public"."course_teacher"."id";



CREATE TABLE IF NOT EXISTS "public"."homework" (
    "id" integer NOT NULL,
    "class_id" integer NOT NULL,
    "title" character varying(255) NOT NULL,
    "content" "text",
    "deadline" timestamp with time zone NOT NULL,
    "status" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."homework" OWNER TO "postgres";


COMMENT ON TABLE "public"."homework" IS '作业发布表：记录班级的作业发布信息';



COMMENT ON COLUMN "public"."homework"."id" IS '主键 ID';



COMMENT ON COLUMN "public"."homework"."class_id" IS '所属班级 ID';



COMMENT ON COLUMN "public"."homework"."title" IS '作业标题';



COMMENT ON COLUMN "public"."homework"."content" IS '作业详细内容';



COMMENT ON COLUMN "public"."homework"."deadline" IS '截止提交时间';



COMMENT ON COLUMN "public"."homework"."status" IS '状态（1 发布，0 暂存）';



COMMENT ON COLUMN "public"."homework"."created_at" IS '创建时间';



COMMENT ON COLUMN "public"."homework"."updated_at" IS '更新时间';



CREATE TABLE IF NOT EXISTS "public"."homework_file" (
    "id" integer NOT NULL,
    "target_type" character varying(50) NOT NULL,
    "target_id" integer NOT NULL,
    "file_name" character varying(255) NOT NULL,
    "file_path" character varying(512) NOT NULL,
    "file_size" bigint NOT NULL,
    "mime_type" character varying(100),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."homework_file" OWNER TO "postgres";


COMMENT ON TABLE "public"."homework_file" IS '作业附件表：存储作业发布或提交相关的附件信息';



COMMENT ON COLUMN "public"."homework_file"."id" IS '主键 ID';



COMMENT ON COLUMN "public"."homework_file"."target_type" IS '关联目标类型（homework/submission）';



COMMENT ON COLUMN "public"."homework_file"."target_id" IS '关联目标 ID';



COMMENT ON COLUMN "public"."homework_file"."file_name" IS '原始文件名';



COMMENT ON COLUMN "public"."homework_file"."file_path" IS '存储系统路径';



COMMENT ON COLUMN "public"."homework_file"."file_size" IS '文件大小（字节）';



COMMENT ON COLUMN "public"."homework_file"."mime_type" IS '文件 MIME 类型';



COMMENT ON COLUMN "public"."homework_file"."created_at" IS '创建时间';



CREATE SEQUENCE IF NOT EXISTS "public"."homework_file_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."homework_file_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."homework_file_id_seq" OWNED BY "public"."homework_file"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."homework_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."homework_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."homework_id_seq" OWNED BY "public"."homework"."id";



CREATE TABLE IF NOT EXISTS "public"."homework_submission" (
    "id" integer NOT NULL,
    "homework_id" integer NOT NULL,
    "user_id" integer NOT NULL,
    "content" "text",
    "score" numeric(5,2),
    "comment" "text",
    "status" integer DEFAULT 1 NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."homework_submission" OWNER TO "postgres";


COMMENT ON TABLE "public"."homework_submission" IS '作业提交记录：学生提交作业的具体内容与评分';



COMMENT ON COLUMN "public"."homework_submission"."id" IS '主键 ID';



COMMENT ON COLUMN "public"."homework_submission"."homework_id" IS '关联作业 ID';



COMMENT ON COLUMN "public"."homework_submission"."user_id" IS '关联学生用户 ID';



COMMENT ON COLUMN "public"."homework_submission"."content" IS '提交文本内容';



COMMENT ON COLUMN "public"."homework_submission"."score" IS '作业评分';



COMMENT ON COLUMN "public"."homework_submission"."comment" IS '教师评语';



COMMENT ON COLUMN "public"."homework_submission"."status" IS '状态（1 已提交，2 已批改）';



COMMENT ON COLUMN "public"."homework_submission"."submitted_at" IS '提交时间';



COMMENT ON COLUMN "public"."homework_submission"."updated_at" IS '更新时间';



CREATE SEQUENCE IF NOT EXISTS "public"."homework_submission_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."homework_submission_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."homework_submission_id_seq" OWNED BY "public"."homework_submission"."id";



CREATE TABLE IF NOT EXISTS "public"."mfa_settings" (
    "id" integer NOT NULL,
    "user_id" integer NOT NULL,
    "otp_secret" character varying(255),
    "otp_enabled" boolean DEFAULT false NOT NULL,
    "sms_enabled" boolean DEFAULT false NOT NULL,
    "email_enabled" boolean DEFAULT false NOT NULL,
    "fido2_enabled" boolean DEFAULT false NOT NULL,
    "phone_number" character varying(20),
    "required" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."mfa_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."mfa_settings" IS '多因子认证配置表：记录用户 MFA 密钥与细分启用状态';



COMMENT ON COLUMN "public"."mfa_settings"."id" IS '主键 ID';



COMMENT ON COLUMN "public"."mfa_settings"."user_id" IS '关联用户 ID';



COMMENT ON COLUMN "public"."mfa_settings"."otp_secret" IS 'OTP 共享密钥';



COMMENT ON COLUMN "public"."mfa_settings"."otp_enabled" IS '是否启用 OTP';



COMMENT ON COLUMN "public"."mfa_settings"."sms_enabled" IS '是否启用短信认证';



COMMENT ON COLUMN "public"."mfa_settings"."email_enabled" IS '是否启用邮件认证';



COMMENT ON COLUMN "public"."mfa_settings"."fido2_enabled" IS '是否启用 FIDO2/WebAuthn';



COMMENT ON COLUMN "public"."mfa_settings"."phone_number" IS 'MFA 绑定的手机号（若与账号不同）';



COMMENT ON COLUMN "public"."mfa_settings"."required" IS '是否强制要求 MFA';



COMMENT ON COLUMN "public"."mfa_settings"."created_at" IS '创建时间';



COMMENT ON COLUMN "public"."mfa_settings"."updated_at" IS '更新时间';



CREATE SEQUENCE IF NOT EXISTS "public"."mfa_settings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."mfa_settings_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."mfa_settings_id_seq" OWNED BY "public"."mfa_settings"."id";



CREATE TABLE IF NOT EXISTS "public"."notification" (
    "id" integer NOT NULL,
    "type" character varying(50) NOT NULL,
    "title" character varying(255) NOT NULL,
    "content" "text" NOT NULL,
    "target_user_id" integer NOT NULL,
    "sender_id" integer NOT NULL,
    "status" character varying(20) DEFAULT 'unread'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notification" OWNER TO "postgres";


COMMENT ON TABLE "public"."notification" IS '系统通知表：记录用户收到的通知信息';



COMMENT ON COLUMN "public"."notification"."id" IS '主键 ID';



COMMENT ON COLUMN "public"."notification"."type" IS '通知类型';



COMMENT ON COLUMN "public"."notification"."title" IS '通知标题';



COMMENT ON COLUMN "public"."notification"."content" IS '通知正文';



COMMENT ON COLUMN "public"."notification"."target_user_id" IS '接收用户 ID';



COMMENT ON COLUMN "public"."notification"."sender_id" IS '发送者 ID（系统发送可为 0）';



COMMENT ON COLUMN "public"."notification"."status" IS '状态（unread/read）';



COMMENT ON COLUMN "public"."notification"."created_at" IS '创建时间';



COMMENT ON COLUMN "public"."notification"."updated_at" IS '更新时间';



CREATE SEQUENCE IF NOT EXISTS "public"."notification_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."notification_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."notification_id_seq" OWNED BY "public"."notification"."id";



CREATE TABLE IF NOT EXISTS "public"."oidc_clients" (
    "client_id" character varying(255) NOT NULL,
    "client_secret" character varying(255),
    "name" character varying(255),
    "allowed_redirect_uris" "jsonb" NOT NULL,
    "scopes" "jsonb",
    "status" character varying(20) DEFAULT 'active'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."oidc_clients" OWNER TO "postgres";


COMMENT ON TABLE "public"."oidc_clients" IS 'OIDC 客户端注册表：记录允许接入的第三方应用配置';



COMMENT ON COLUMN "public"."oidc_clients"."client_id" IS '客户端唯一 ID';



COMMENT ON COLUMN "public"."oidc_clients"."client_secret" IS '客户端密钥';



COMMENT ON COLUMN "public"."oidc_clients"."name" IS '客户端名称';



COMMENT ON COLUMN "public"."oidc_clients"."allowed_redirect_uris" IS '允许的回调 URI 列表（JSON 数组）';



COMMENT ON COLUMN "public"."oidc_clients"."scopes" IS '允许的权限范围列表（JSON 数组）';



COMMENT ON COLUMN "public"."oidc_clients"."status" IS '状态（active/disabled）';



COMMENT ON COLUMN "public"."oidc_clients"."created_at" IS '创建时间';



COMMENT ON COLUMN "public"."oidc_clients"."updated_at" IS '更新时间';



CREATE TABLE IF NOT EXISTS "public"."oidc_keys" (
    "kid" character varying(255) NOT NULL,
    "kty" character varying(50) NOT NULL,
    "use" character varying(50) NOT NULL,
    "alg" character varying(50) NOT NULL,
    "public_pem" "text" NOT NULL,
    "private_pem_enc" "text" NOT NULL,
    "status" character varying(20) DEFAULT 'active'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."oidc_keys" OWNER TO "postgres";


COMMENT ON TABLE "public"."oidc_keys" IS 'OIDC 签名密钥库：存储 JWKS 相关的非对称密钥';



COMMENT ON COLUMN "public"."oidc_keys"."kid" IS '密钥 ID';



COMMENT ON COLUMN "public"."oidc_keys"."kty" IS '密钥类型（如 RSA）';



COMMENT ON COLUMN "public"."oidc_keys"."use" IS '用途（如 sig）';



COMMENT ON COLUMN "public"."oidc_keys"."alg" IS '算法（如 RS256）';



COMMENT ON COLUMN "public"."oidc_keys"."public_pem" IS 'PEM 格式公钥';



COMMENT ON COLUMN "public"."oidc_keys"."private_pem_enc" IS '加密后的 PEM 格式私钥';



COMMENT ON COLUMN "public"."oidc_keys"."status" IS '状态（active/rotated/expired）';



COMMENT ON COLUMN "public"."oidc_keys"."created_at" IS '创建时间';



CREATE TABLE IF NOT EXISTS "public"."password_resets" (
    "id" integer NOT NULL,
    "user_id" integer NOT NULL,
    "token_hash" character varying(255) NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "used" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."password_resets" OWNER TO "postgres";


COMMENT ON TABLE "public"."password_resets" IS '重置密码记录：存储重置令牌与有效期';



COMMENT ON COLUMN "public"."password_resets"."id" IS '主键 ID';



COMMENT ON COLUMN "public"."password_resets"."user_id" IS '关联用户 ID';



COMMENT ON COLUMN "public"."password_resets"."token_hash" IS '重置令牌哈希';



COMMENT ON COLUMN "public"."password_resets"."expires_at" IS '过期时间';



COMMENT ON COLUMN "public"."password_resets"."used" IS '是否已使用';



COMMENT ON COLUMN "public"."password_resets"."created_at" IS '创建时间';



COMMENT ON COLUMN "public"."password_resets"."updated_at" IS '更新时间';



CREATE SEQUENCE IF NOT EXISTS "public"."password_resets_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."password_resets_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."password_resets_id_seq" OWNED BY "public"."password_resets"."id";



CREATE TABLE IF NOT EXISTS "public"."permission" (
    "id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "code" character varying(100) NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."permission" OWNER TO "postgres";


COMMENT ON TABLE "public"."permission" IS '权限项定义表：记录系统原子功能权限';



COMMENT ON COLUMN "public"."permission"."id" IS '主键 ID';



COMMENT ON COLUMN "public"."permission"."name" IS '权限名称';



COMMENT ON COLUMN "public"."permission"."code" IS '权限代码（唯一，如 user:create）';



COMMENT ON COLUMN "public"."permission"."description" IS '权限详细描述';



COMMENT ON COLUMN "public"."permission"."created_at" IS '创建时间';



COMMENT ON COLUMN "public"."permission"."updated_at" IS '更新时间';



CREATE SEQUENCE IF NOT EXISTS "public"."permission_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."permission_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."permission_id_seq" OWNED BY "public"."permission"."id";



CREATE TABLE IF NOT EXISTS "public"."refresh_tokens" (
    "id" integer NOT NULL,
    "client_id" character varying(255) NOT NULL,
    "sub_hash" character varying(255) NOT NULL,
    "rt_hash" character varying(255) NOT NULL,
    "status" character varying(20) DEFAULT 'active'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_used_at" timestamp with time zone,
    "prev_id" integer
);


ALTER TABLE "public"."refresh_tokens" OWNER TO "postgres";


COMMENT ON TABLE "public"."refresh_tokens" IS '刷新令牌表：存储 OAuth2/OIDC 刷新令牌及其状态';



COMMENT ON COLUMN "public"."refresh_tokens"."id" IS '主键 ID';



COMMENT ON COLUMN "public"."refresh_tokens"."client_id" IS '客户端 ID';



COMMENT ON COLUMN "public"."refresh_tokens"."sub_hash" IS 'Subject 哈希值';



COMMENT ON COLUMN "public"."refresh_tokens"."rt_hash" IS 'RefreshToken 哈希值';



COMMENT ON COLUMN "public"."refresh_tokens"."status" IS '状态（active/revoked/expired）';



COMMENT ON COLUMN "public"."refresh_tokens"."created_at" IS '创建时间';



COMMENT ON COLUMN "public"."refresh_tokens"."last_used_at" IS '最后使用时间';



COMMENT ON COLUMN "public"."refresh_tokens"."prev_id" IS '前一个令牌 ID (用于滚动更新防重放)';



CREATE SEQUENCE IF NOT EXISTS "public"."refresh_tokens_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."refresh_tokens_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."refresh_tokens_id_seq" OWNED BY "public"."refresh_tokens"."id";



CREATE TABLE IF NOT EXISTS "public"."role" (
    "id" integer NOT NULL,
    "name" character varying(50) NOT NULL,
    "code" character varying(50) NOT NULL,
    "description" "text",
    "status" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."role" OWNER TO "postgres";


COMMENT ON TABLE "public"."role" IS '角色表：定义系统角色与权限聚合';



COMMENT ON COLUMN "public"."role"."id" IS '主键 ID';



COMMENT ON COLUMN "public"."role"."name" IS '角色名称（唯一）';



COMMENT ON COLUMN "public"."role"."code" IS '角色编码（唯一）';



COMMENT ON COLUMN "public"."role"."description" IS '角色描述';



COMMENT ON COLUMN "public"."role"."status" IS '状态（1 正常）';



COMMENT ON COLUMN "public"."role"."created_at" IS '创建时间';



COMMENT ON COLUMN "public"."role"."updated_at" IS '更新时间';



CREATE SEQUENCE IF NOT EXISTS "public"."role_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."role_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."role_id_seq" OWNED BY "public"."role"."id";



CREATE TABLE IF NOT EXISTS "public"."role_permission" (
    "id" integer NOT NULL,
    "role_id" integer NOT NULL,
    "permission_id" integer NOT NULL
);


ALTER TABLE "public"."role_permission" OWNER TO "postgres";


COMMENT ON TABLE "public"."role_permission" IS '角色-权限关联表：角色与权限的多对多关系';



COMMENT ON COLUMN "public"."role_permission"."id" IS '主键 ID';



COMMENT ON COLUMN "public"."role_permission"."role_id" IS '角色 ID';



COMMENT ON COLUMN "public"."role_permission"."permission_id" IS '权限 ID';



CREATE SEQUENCE IF NOT EXISTS "public"."role_permission_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."role_permission_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."role_permission_id_seq" OWNED BY "public"."role_permission"."id";



CREATE TABLE IF NOT EXISTS "public"."schedule" (
    "id" integer NOT NULL,
    "class_id" integer NOT NULL,
    "weekday" integer NOT NULL,
    "time_slot_id" integer NOT NULL,
    "room" character varying(100) NOT NULL,
    "location" character varying(255) NOT NULL
);


ALTER TABLE "public"."schedule" OWNER TO "postgres";


COMMENT ON TABLE "public"."schedule" IS '课程课表安排：记录班级在某时间片的教室与地点';



COMMENT ON COLUMN "public"."schedule"."id" IS '主键 ID';



COMMENT ON COLUMN "public"."schedule"."class_id" IS '班级 ID';



COMMENT ON COLUMN "public"."schedule"."weekday" IS '星期（1-7）';



COMMENT ON COLUMN "public"."schedule"."time_slot_id" IS '时间片 ID';



COMMENT ON COLUMN "public"."schedule"."room" IS '教室';



COMMENT ON COLUMN "public"."schedule"."location" IS '地点';



CREATE SEQUENCE IF NOT EXISTS "public"."schedule_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."schedule_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."schedule_id_seq" OWNED BY "public"."schedule"."id";



CREATE TABLE IF NOT EXISTS "public"."sub_course" (
    "id" integer NOT NULL,
    "course_id" integer NOT NULL,
    "sub_course_code" character varying(50) NOT NULL,
    "teacher_id" integer NOT NULL,
    "academic_year" integer NOT NULL,
    "status" integer DEFAULT 1 NOT NULL
);


ALTER TABLE "public"."sub_course" OWNER TO "postgres";


COMMENT ON TABLE "public"."sub_course" IS '分课程表：记录课程的分支/子课程信息与任课教师';



COMMENT ON COLUMN "public"."sub_course"."id" IS '主键 ID';



COMMENT ON COLUMN "public"."sub_course"."course_id" IS '课程 ID';



COMMENT ON COLUMN "public"."sub_course"."sub_course_code" IS '子课程代号（唯一）';



COMMENT ON COLUMN "public"."sub_course"."teacher_id" IS '任课教师 ID';



COMMENT ON COLUMN "public"."sub_course"."academic_year" IS '学年';



COMMENT ON COLUMN "public"."sub_course"."status" IS '状态（1 正常）';



CREATE SEQUENCE IF NOT EXISTS "public"."sub_course_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."sub_course_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."sub_course_id_seq" OWNED BY "public"."sub_course"."id";



CREATE TABLE IF NOT EXISTS "public"."teacher" (
    "id" integer NOT NULL,
    "user_id" integer,
    "real_name" character varying(255) NOT NULL,
    "email" character varying(255) NOT NULL,
    "phone" character varying(20) NOT NULL,
    "department" character varying(255) NOT NULL,
    "title" character varying(100),
    "status" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."teacher" OWNER TO "postgres";


COMMENT ON TABLE "public"."teacher" IS '教师表：记录教师的基本信息与所属院系';



COMMENT ON COLUMN "public"."teacher"."id" IS '主键 ID';



COMMENT ON COLUMN "public"."teacher"."user_id" IS '关联用户 ID（可空）';



COMMENT ON COLUMN "public"."teacher"."real_name" IS '教师姓名';



COMMENT ON COLUMN "public"."teacher"."email" IS '邮箱（唯一）';



COMMENT ON COLUMN "public"."teacher"."phone" IS '手机号（唯一）';



COMMENT ON COLUMN "public"."teacher"."department" IS '所属院系';



COMMENT ON COLUMN "public"."teacher"."title" IS '职称（可空）';



COMMENT ON COLUMN "public"."teacher"."status" IS '状态（1 正常）';



COMMENT ON COLUMN "public"."teacher"."created_at" IS '创建时间';



COMMENT ON COLUMN "public"."teacher"."updated_at" IS '更新时间';



CREATE SEQUENCE IF NOT EXISTS "public"."teacher_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."teacher_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."teacher_id_seq" OWNED BY "public"."teacher"."id";



CREATE TABLE IF NOT EXISTS "public"."time_slot" (
    "id" integer NOT NULL,
    "course_id" integer NOT NULL,
    "week_day" integer NOT NULL,
    "start_time" character varying(10) NOT NULL,
    "end_time" character varying(10) NOT NULL,
    "location" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."time_slot" OWNER TO "postgres";


COMMENT ON TABLE "public"."time_slot" IS '上课时间片表：记录课程的周次与时间段安排';



COMMENT ON COLUMN "public"."time_slot"."id" IS '主键 ID';



COMMENT ON COLUMN "public"."time_slot"."course_id" IS '课程 ID';



COMMENT ON COLUMN "public"."time_slot"."week_day" IS '星期（1-7）';



COMMENT ON COLUMN "public"."time_slot"."start_time" IS '开始时间（HH:mm）';



COMMENT ON COLUMN "public"."time_slot"."end_time" IS '结束时间（HH:mm）';



COMMENT ON COLUMN "public"."time_slot"."location" IS '上课地点（可空）';



COMMENT ON COLUMN "public"."time_slot"."created_at" IS '创建时间';



COMMENT ON COLUMN "public"."time_slot"."updated_at" IS '更新时间';



CREATE SEQUENCE IF NOT EXISTS "public"."time_slot_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."time_slot_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."time_slot_id_seq" OWNED BY "public"."time_slot"."id";



CREATE TABLE IF NOT EXISTS "public"."user" (
    "id" integer NOT NULL,
    "username" character varying(50) NOT NULL,
    "password" character varying(255) NOT NULL,
    "real_name" character varying(255) NOT NULL,
    "student_id" character varying(11) NOT NULL,
    "enrollment_year" integer NOT NULL,
    "major" character varying(100) NOT NULL,
    "status" integer DEFAULT 1 NOT NULL,
    "weak_password_flag" boolean DEFAULT false NOT NULL,
    "email" character varying(255),
    "phone" character varying(20),
    "roles" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user" OWNER TO "postgres";


COMMENT ON TABLE "public"."user" IS '用户基础信息表：存储登录账号及核心个人信息';



COMMENT ON COLUMN "public"."user"."id" IS '主键 ID';



COMMENT ON COLUMN "public"."user"."username" IS '登录用户名';



COMMENT ON COLUMN "public"."user"."password" IS '加密后的密码';



COMMENT ON COLUMN "public"."user"."real_name" IS '真实姓名';



COMMENT ON COLUMN "public"."user"."student_id" IS '学号';



COMMENT ON COLUMN "public"."user"."enrollment_year" IS '入学年份';



COMMENT ON COLUMN "public"."user"."major" IS '专业';



COMMENT ON COLUMN "public"."user"."status" IS '状态：1-启用，0-禁用';



COMMENT ON COLUMN "public"."user"."weak_password_flag" IS '弱密码标识';



COMMENT ON COLUMN "public"."user"."email" IS '邮箱';



COMMENT ON COLUMN "public"."user"."phone" IS '手机号';



COMMENT ON COLUMN "public"."user"."roles" IS '用户角色列表';



COMMENT ON COLUMN "public"."user"."created_at" IS '创建时间';



COMMENT ON COLUMN "public"."user"."updated_at" IS '更新时间';



CREATE TABLE IF NOT EXISTS "public"."user_class" (
    "id" integer NOT NULL,
    "user_id" integer NOT NULL,
    "class_id" integer NOT NULL,
    "join_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_class" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_class" IS '用户选课班级表：记录用户加入班级的关系与状态';



COMMENT ON COLUMN "public"."user_class"."id" IS '主键 ID';



COMMENT ON COLUMN "public"."user_class"."user_id" IS '用户 ID';



COMMENT ON COLUMN "public"."user_class"."class_id" IS '班级 ID';



COMMENT ON COLUMN "public"."user_class"."join_time" IS '加入时间';



COMMENT ON COLUMN "public"."user_class"."status" IS '状态（1 正常）';



COMMENT ON COLUMN "public"."user_class"."created_at" IS '创建时间';



COMMENT ON COLUMN "public"."user_class"."updated_at" IS '更新时间';



CREATE SEQUENCE IF NOT EXISTS "public"."user_class_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."user_class_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_class_id_seq" OWNED BY "public"."user_class"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."user_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."user_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_id_seq" OWNED BY "public"."user"."id";



CREATE TABLE IF NOT EXISTS "public"."user_role" (
    "user_id" integer NOT NULL,
    "role_id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_role" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_role" IS '用户角色关联表：用户与角色的多对多关联';



COMMENT ON COLUMN "public"."user_role"."user_id" IS '用户 ID（复合主键）';



COMMENT ON COLUMN "public"."user_role"."role_id" IS '角色 ID（复合主键）';



COMMENT ON COLUMN "public"."user_role"."created_at" IS '创建时间';



COMMENT ON COLUMN "public"."user_role"."updated_at" IS '更新时间';



ALTER TABLE ONLY "public"."academic_config" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."academic_config_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."attendance_record" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."attendance_record_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."attendance_task" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."attendance_task_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."class" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."class_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."course" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."course_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."course_rep" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."course_rep_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."course_teacher" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."course_teacher_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."homework" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."homework_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."homework_file" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."homework_file_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."homework_submission" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."homework_submission_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."mfa_settings" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."mfa_settings_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."notification" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."notification_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."password_resets" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."password_resets_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."permission" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."permission_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."refresh_tokens" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."refresh_tokens_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."role" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."role_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."role_permission" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."role_permission_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."schedule" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."schedule_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."sub_course" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."sub_course_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."teacher" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."teacher_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."time_slot" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."time_slot_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user_class" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_class_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."academic_config"
    ADD CONSTRAINT "academic_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendance_record"
    ADD CONSTRAINT "attendance_record_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendance_record"
    ADD CONSTRAINT "attendance_record_task_id_user_id_uk" UNIQUE ("task_id", "user_id");



ALTER TABLE ONLY "public"."attendance_task"
    ADD CONSTRAINT "attendance_task_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."class"
    ADD CONSTRAINT "class_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."class"
    ADD CONSTRAINT "class_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."course"
    ADD CONSTRAINT "course_code_key" UNIQUE ("course_code");



ALTER TABLE ONLY "public"."course"
    ADD CONSTRAINT "course_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."course_rep"
    ADD CONSTRAINT "course_rep_class_id_user_id_uk" UNIQUE ("class_id", "user_id");



ALTER TABLE ONLY "public"."course_rep"
    ADD CONSTRAINT "course_rep_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."course_teacher"
    ADD CONSTRAINT "course_teacher_class_id_teacher_id_uk" UNIQUE ("class_id", "teacher_id");



ALTER TABLE ONLY "public"."course_teacher"
    ADD CONSTRAINT "course_teacher_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."homework_file"
    ADD CONSTRAINT "homework_file_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."homework"
    ADD CONSTRAINT "homework_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."homework_submission"
    ADD CONSTRAINT "homework_submission_homework_id_user_id_uk" UNIQUE ("homework_id", "user_id");



ALTER TABLE ONLY "public"."homework_submission"
    ADD CONSTRAINT "homework_submission_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mfa_settings"
    ADD CONSTRAINT "mfa_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mfa_settings"
    ADD CONSTRAINT "mfa_settings_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."notification"
    ADD CONSTRAINT "notification_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."oidc_clients"
    ADD CONSTRAINT "oidc_clients_pkey" PRIMARY KEY ("client_id");



ALTER TABLE ONLY "public"."oidc_keys"
    ADD CONSTRAINT "oidc_keys_pkey" PRIMARY KEY ("kid");



ALTER TABLE ONLY "public"."password_resets"
    ADD CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permission"
    ADD CONSTRAINT "permission_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."permission"
    ADD CONSTRAINT "permission_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role"
    ADD CONSTRAINT "role_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."role"
    ADD CONSTRAINT "role_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."role_permission"
    ADD CONSTRAINT "role_permission_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role"
    ADD CONSTRAINT "role_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schedule"
    ADD CONSTRAINT "schedule_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sub_course"
    ADD CONSTRAINT "sub_course_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teacher"
    ADD CONSTRAINT "teacher_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."teacher"
    ADD CONSTRAINT "teacher_phone_key" UNIQUE ("phone");



ALTER TABLE ONLY "public"."teacher"
    ADD CONSTRAINT "teacher_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."time_slot"
    ADD CONSTRAINT "time_slot_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_class"
    ADD CONSTRAINT "user_class_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user"
    ADD CONSTRAINT "user_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."user"
    ADD CONSTRAINT "user_phone_key" UNIQUE ("phone");



ALTER TABLE ONLY "public"."user"
    ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_role"
    ADD CONSTRAINT "user_role_pkey" PRIMARY KEY ("user_id", "role_id");



ALTER TABLE ONLY "public"."user"
    ADD CONSTRAINT "user_student_id_key" UNIQUE ("student_id");



ALTER TABLE ONLY "public"."user"
    ADD CONSTRAINT "user_username_key" UNIQUE ("username");



CREATE INDEX "password_resets_token_hash_idx" ON "public"."password_resets" USING "btree" ("token_hash");



ALTER TABLE ONLY "public"."attendance_record"
    ADD CONSTRAINT "attendance_record_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."attendance_task"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attendance_record"
    ADD CONSTRAINT "attendance_record_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attendance_task"
    ADD CONSTRAINT "attendance_task_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."class"
    ADD CONSTRAINT "class_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."course_rep"
    ADD CONSTRAINT "course_rep_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."class"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."course_rep"
    ADD CONSTRAINT "course_rep_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."course_teacher"
    ADD CONSTRAINT "course_teacher_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."class"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."course_teacher"
    ADD CONSTRAINT "course_teacher_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."teacher"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."homework"
    ADD CONSTRAINT "homework_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."class"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."homework_submission"
    ADD CONSTRAINT "homework_submission_homework_id_fkey" FOREIGN KEY ("homework_id") REFERENCES "public"."homework"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."homework_submission"
    ADD CONSTRAINT "homework_submission_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mfa_settings"
    ADD CONSTRAINT "mfa_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification"
    ADD CONSTRAINT "notification_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."password_resets"
    ADD CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permission"
    ADD CONSTRAINT "role_permission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permission"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permission"
    ADD CONSTRAINT "role_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedule"
    ADD CONSTRAINT "schedule_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."class"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedule"
    ADD CONSTRAINT "schedule_time_slot_id_fkey" FOREIGN KEY ("time_slot_id") REFERENCES "public"."time_slot"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sub_course"
    ADD CONSTRAINT "sub_course_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sub_course"
    ADD CONSTRAINT "sub_course_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."teacher"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teacher"
    ADD CONSTRAINT "teacher_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."time_slot"
    ADD CONSTRAINT "time_slot_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_class"
    ADD CONSTRAINT "user_class_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."class"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_class"
    ADD CONSTRAINT "user_class_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_role"
    ADD CONSTRAINT "user_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_role"
    ADD CONSTRAINT "user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE;



ALTER TABLE "public"."mfa_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."refresh_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."auth_issue_refresh_token"("p_client_id" "text", "p_sub" "text", "p_rt_hash" "text", "p_prev_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."auth_issue_refresh_token"("p_client_id" "text", "p_sub" "text", "p_rt_hash" "text", "p_prev_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_issue_refresh_token"("p_client_id" "text", "p_sub" "text", "p_rt_hash" "text", "p_prev_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."auth_mark_rt_used"("p_id" bigint, "p_used_at" timestamp without time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."auth_mark_rt_used"("p_id" bigint, "p_used_at" timestamp without time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_mark_rt_used"("p_id" bigint, "p_used_at" timestamp without time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."auth_reset_password"("p_student_id" "text", "p_new_hash" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."auth_reset_password"("p_student_id" "text", "p_new_hash" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_reset_password"("p_student_id" "text", "p_new_hash" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."auth_revoke_client_rt"("p_client_id" "text", "p_sub" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."auth_revoke_client_rt"("p_client_id" "text", "p_sub" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_revoke_client_rt"("p_client_id" "text", "p_sub" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."auth_revoke_rt_by_id"("p_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."auth_revoke_rt_by_id"("p_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_revoke_rt_by_id"("p_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."auth_revoke_rt_by_sub"("p_sub" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."auth_revoke_rt_by_sub"("p_sub" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_revoke_rt_by_sub"("p_sub" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";


















GRANT ALL ON TABLE "public"."academic_config" TO "anon";
GRANT ALL ON TABLE "public"."academic_config" TO "authenticated";
GRANT ALL ON TABLE "public"."academic_config" TO "service_role";



GRANT ALL ON SEQUENCE "public"."academic_config_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."academic_config_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."academic_config_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."attendance_record" TO "anon";
GRANT ALL ON TABLE "public"."attendance_record" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance_record" TO "service_role";



GRANT ALL ON SEQUENCE "public"."attendance_record_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."attendance_record_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."attendance_record_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."attendance_task" TO "anon";
GRANT ALL ON TABLE "public"."attendance_task" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance_task" TO "service_role";



GRANT ALL ON SEQUENCE "public"."attendance_task_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."attendance_task_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."attendance_task_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."class" TO "anon";
GRANT ALL ON TABLE "public"."class" TO "authenticated";
GRANT ALL ON TABLE "public"."class" TO "service_role";



GRANT ALL ON SEQUENCE "public"."class_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."class_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."class_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."course" TO "anon";
GRANT ALL ON TABLE "public"."course" TO "authenticated";
GRANT ALL ON TABLE "public"."course" TO "service_role";



GRANT ALL ON SEQUENCE "public"."course_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."course_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."course_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."course_rep" TO "anon";
GRANT ALL ON TABLE "public"."course_rep" TO "authenticated";
GRANT ALL ON TABLE "public"."course_rep" TO "service_role";



GRANT ALL ON SEQUENCE "public"."course_rep_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."course_rep_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."course_rep_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."course_teacher" TO "anon";
GRANT ALL ON TABLE "public"."course_teacher" TO "authenticated";
GRANT ALL ON TABLE "public"."course_teacher" TO "service_role";



GRANT ALL ON SEQUENCE "public"."course_teacher_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."course_teacher_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."course_teacher_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."homework" TO "anon";
GRANT ALL ON TABLE "public"."homework" TO "authenticated";
GRANT ALL ON TABLE "public"."homework" TO "service_role";



GRANT ALL ON TABLE "public"."homework_file" TO "anon";
GRANT ALL ON TABLE "public"."homework_file" TO "authenticated";
GRANT ALL ON TABLE "public"."homework_file" TO "service_role";



GRANT ALL ON SEQUENCE "public"."homework_file_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."homework_file_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."homework_file_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."homework_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."homework_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."homework_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."homework_submission" TO "anon";
GRANT ALL ON TABLE "public"."homework_submission" TO "authenticated";
GRANT ALL ON TABLE "public"."homework_submission" TO "service_role";



GRANT ALL ON SEQUENCE "public"."homework_submission_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."homework_submission_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."homework_submission_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."mfa_settings" TO "anon";
GRANT ALL ON TABLE "public"."mfa_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."mfa_settings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."mfa_settings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."mfa_settings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."mfa_settings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."notification" TO "anon";
GRANT ALL ON TABLE "public"."notification" TO "authenticated";
GRANT ALL ON TABLE "public"."notification" TO "service_role";



GRANT ALL ON SEQUENCE "public"."notification_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notification_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notification_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."oidc_clients" TO "anon";
GRANT ALL ON TABLE "public"."oidc_clients" TO "authenticated";
GRANT ALL ON TABLE "public"."oidc_clients" TO "service_role";



GRANT ALL ON TABLE "public"."oidc_keys" TO "anon";
GRANT ALL ON TABLE "public"."oidc_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."oidc_keys" TO "service_role";



GRANT ALL ON TABLE "public"."password_resets" TO "anon";
GRANT ALL ON TABLE "public"."password_resets" TO "authenticated";
GRANT ALL ON TABLE "public"."password_resets" TO "service_role";



GRANT ALL ON SEQUENCE "public"."password_resets_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."password_resets_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."password_resets_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."permission" TO "anon";
GRANT ALL ON TABLE "public"."permission" TO "authenticated";
GRANT ALL ON TABLE "public"."permission" TO "service_role";



GRANT ALL ON SEQUENCE "public"."permission_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."permission_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."permission_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."refresh_tokens" TO "anon";
GRANT ALL ON TABLE "public"."refresh_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."refresh_tokens" TO "service_role";



GRANT ALL ON SEQUENCE "public"."refresh_tokens_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."refresh_tokens_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."refresh_tokens_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."role" TO "anon";
GRANT ALL ON TABLE "public"."role" TO "authenticated";
GRANT ALL ON TABLE "public"."role" TO "service_role";



GRANT ALL ON SEQUENCE "public"."role_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."role_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."role_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."role_permission" TO "anon";
GRANT ALL ON TABLE "public"."role_permission" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permission" TO "service_role";



GRANT ALL ON SEQUENCE "public"."role_permission_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."role_permission_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."role_permission_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."schedule" TO "anon";
GRANT ALL ON TABLE "public"."schedule" TO "authenticated";
GRANT ALL ON TABLE "public"."schedule" TO "service_role";



GRANT ALL ON SEQUENCE "public"."schedule_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."schedule_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."schedule_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sub_course" TO "anon";
GRANT ALL ON TABLE "public"."sub_course" TO "authenticated";
GRANT ALL ON TABLE "public"."sub_course" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sub_course_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sub_course_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sub_course_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."teacher" TO "anon";
GRANT ALL ON TABLE "public"."teacher" TO "authenticated";
GRANT ALL ON TABLE "public"."teacher" TO "service_role";



GRANT ALL ON SEQUENCE "public"."teacher_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."teacher_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."teacher_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."time_slot" TO "anon";
GRANT ALL ON TABLE "public"."time_slot" TO "authenticated";
GRANT ALL ON TABLE "public"."time_slot" TO "service_role";



GRANT ALL ON SEQUENCE "public"."time_slot_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."time_slot_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."time_slot_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user" TO "anon";
GRANT ALL ON TABLE "public"."user" TO "authenticated";
GRANT ALL ON TABLE "public"."user" TO "service_role";



GRANT ALL ON TABLE "public"."user_class" TO "anon";
GRANT ALL ON TABLE "public"."user_class" TO "authenticated";
GRANT ALL ON TABLE "public"."user_class" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_class_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_class_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_class_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_role" TO "anon";
GRANT ALL ON TABLE "public"."user_role" TO "authenticated";
GRANT ALL ON TABLE "public"."user_role" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































drop extension if exists "pg_net";


