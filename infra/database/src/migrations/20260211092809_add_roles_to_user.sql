-- Set comment to schema: "public"
COMMENT ON SCHEMA "public" IS '标准公共模式';
-- Create "academic_config" table
CREATE TABLE "public"."academic_config" (
  "id" serial NOT NULL,
  "year" character varying(10) NOT NULL,
  "semester" integer NOT NULL,
  "start_date" timestamptz NOT NULL,
  "end_date" timestamptz NOT NULL,
  "is_current" boolean NOT NULL DEFAULT false,
  "status" integer NOT NULL DEFAULT 1,
  PRIMARY KEY ("id")
);
-- Set comment to table: "academic_config"
COMMENT ON TABLE "public"."academic_config" IS '学期教学配置：定义学年、学期及其起止日期';
-- Set comment to column: "id" on table: "academic_config"
COMMENT ON COLUMN "public"."academic_config"."id" IS '主键 ID';
-- Set comment to column: "year" on table: "academic_config"
COMMENT ON COLUMN "public"."academic_config"."year" IS '学年（如 2023-2024）';
-- Set comment to column: "semester" on table: "academic_config"
COMMENT ON COLUMN "public"."academic_config"."semester" IS '学期（1-第一学期，2-第二学期）';
-- Set comment to column: "start_date" on table: "academic_config"
COMMENT ON COLUMN "public"."academic_config"."start_date" IS '学期开始日期';
-- Set comment to column: "end_date" on table: "academic_config"
COMMENT ON COLUMN "public"."academic_config"."end_date" IS '学期结束日期';
-- Set comment to column: "is_current" on table: "academic_config"
COMMENT ON COLUMN "public"."academic_config"."is_current" IS '是否为当前学期';
-- Set comment to column: "status" on table: "academic_config"
COMMENT ON COLUMN "public"."academic_config"."status" IS '状态（1 正常）';
-- Create "refresh_tokens" table
CREATE TABLE "public"."refresh_tokens" (
  "id" serial NOT NULL,
  "client_id" character varying(255) NOT NULL,
  "sub_hash" character varying(255) NOT NULL,
  "rt_hash" character varying(255) NOT NULL,
  "status" character varying(20) NOT NULL DEFAULT 'active',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "last_used_at" timestamptz NULL,
  "prev_id" integer NULL,
  PRIMARY KEY ("id")
);
-- Set comment to table: "refresh_tokens"
COMMENT ON TABLE "public"."refresh_tokens" IS '刷新令牌表：存储 OAuth2/OIDC 刷新令牌及其状态';
-- Set comment to column: "id" on table: "refresh_tokens"
COMMENT ON COLUMN "public"."refresh_tokens"."id" IS '主键 ID';
-- Set comment to column: "client_id" on table: "refresh_tokens"
COMMENT ON COLUMN "public"."refresh_tokens"."client_id" IS '客户端 ID';
-- Set comment to column: "sub_hash" on table: "refresh_tokens"
COMMENT ON COLUMN "public"."refresh_tokens"."sub_hash" IS 'Subject 哈希值';
-- Set comment to column: "rt_hash" on table: "refresh_tokens"
COMMENT ON COLUMN "public"."refresh_tokens"."rt_hash" IS 'RefreshToken 哈希值';
-- Set comment to column: "status" on table: "refresh_tokens"
COMMENT ON COLUMN "public"."refresh_tokens"."status" IS '状态（active/revoked/expired）';
-- Set comment to column: "created_at" on table: "refresh_tokens"
COMMENT ON COLUMN "public"."refresh_tokens"."created_at" IS '创建时间';
-- Set comment to column: "last_used_at" on table: "refresh_tokens"
COMMENT ON COLUMN "public"."refresh_tokens"."last_used_at" IS '最后使用时间';
-- Set comment to column: "prev_id" on table: "refresh_tokens"
COMMENT ON COLUMN "public"."refresh_tokens"."prev_id" IS '前一个令牌 ID (用于滚动更新防重放)';
-- Create "course" table
CREATE TABLE "public"."course" (
  "id" serial NOT NULL,
  "course_code" character varying(50) NOT NULL,
  "course_name" character varying(255) NOT NULL,
  "semester" integer NOT NULL,
  "academic_year" integer NOT NULL,
  "available_majors" jsonb NULL,
  "description" text NULL,
  "credit" numeric(3,1) NOT NULL DEFAULT 0,
  "department" character varying(255) NULL,
  "status" integer NOT NULL DEFAULT 1,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "course_code_key" UNIQUE ("course_code")
);
-- Set comment to table: "course"
COMMENT ON TABLE "public"."course" IS '课程基本信息表：记录全校课程的基础元数据';
-- Set comment to column: "id" on table: "course"
COMMENT ON COLUMN "public"."course"."id" IS '主键 ID';
-- Set comment to column: "course_code" on table: "course"
COMMENT ON COLUMN "public"."course"."course_code" IS '课程代码（唯一）';
-- Set comment to column: "course_name" on table: "course"
COMMENT ON COLUMN "public"."course"."course_name" IS '课程名称';
-- Set comment to column: "semester" on table: "course"
COMMENT ON COLUMN "public"."course"."semester" IS '学期';
-- Set comment to column: "academic_year" on table: "course"
COMMENT ON COLUMN "public"."course"."academic_year" IS '学年';
-- Set comment to column: "available_majors" on table: "course"
COMMENT ON COLUMN "public"."course"."available_majors" IS '适用专业';
-- Set comment to column: "description" on table: "course"
COMMENT ON COLUMN "public"."course"."description" IS '课程描述';
-- Set comment to column: "credit" on table: "course"
COMMENT ON COLUMN "public"."course"."credit" IS '学分';
-- Set comment to column: "department" on table: "course"
COMMENT ON COLUMN "public"."course"."department" IS '开课单位';
-- Set comment to column: "status" on table: "course"
COMMENT ON COLUMN "public"."course"."status" IS '状态（1 正常）';
-- Set comment to column: "created_at" on table: "course"
COMMENT ON COLUMN "public"."course"."created_at" IS '创建时间';
-- Set comment to column: "updated_at" on table: "course"
COMMENT ON COLUMN "public"."course"."updated_at" IS '更新时间';
-- Create "oidc_keys" table
CREATE TABLE "public"."oidc_keys" (
  "kid" character varying(255) NOT NULL,
  "kty" character varying(50) NOT NULL,
  "use" character varying(50) NOT NULL,
  "alg" character varying(50) NOT NULL,
  "public_pem" text NOT NULL,
  "private_pem_enc" text NOT NULL,
  "status" character varying(20) NOT NULL DEFAULT 'active',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("kid")
);
-- Set comment to table: "oidc_keys"
COMMENT ON TABLE "public"."oidc_keys" IS 'OIDC 签名密钥库：存储 JWKS 相关的非对称密钥';
-- Set comment to column: "kid" on table: "oidc_keys"
COMMENT ON COLUMN "public"."oidc_keys"."kid" IS '密钥 ID';
-- Set comment to column: "kty" on table: "oidc_keys"
COMMENT ON COLUMN "public"."oidc_keys"."kty" IS '密钥类型（如 RSA）';
-- Set comment to column: "use" on table: "oidc_keys"
COMMENT ON COLUMN "public"."oidc_keys"."use" IS '用途（如 sig）';
-- Set comment to column: "alg" on table: "oidc_keys"
COMMENT ON COLUMN "public"."oidc_keys"."alg" IS '算法（如 RS256）';
-- Set comment to column: "public_pem" on table: "oidc_keys"
COMMENT ON COLUMN "public"."oidc_keys"."public_pem" IS 'PEM 格式公钥';
-- Set comment to column: "private_pem_enc" on table: "oidc_keys"
COMMENT ON COLUMN "public"."oidc_keys"."private_pem_enc" IS '加密后的 PEM 格式私钥';
-- Set comment to column: "status" on table: "oidc_keys"
COMMENT ON COLUMN "public"."oidc_keys"."status" IS '状态（active/rotated/expired）';
-- Set comment to column: "created_at" on table: "oidc_keys"
COMMENT ON COLUMN "public"."oidc_keys"."created_at" IS '创建时间';
-- Create "oidc_clients" table
CREATE TABLE "public"."oidc_clients" (
  "client_id" character varying(255) NOT NULL,
  "client_secret" character varying(255) NULL,
  "name" character varying(255) NULL,
  "allowed_redirect_uris" jsonb NOT NULL,
  "scopes" jsonb NULL,
  "status" character varying(20) NOT NULL DEFAULT 'active',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("client_id")
);
-- Set comment to table: "oidc_clients"
COMMENT ON TABLE "public"."oidc_clients" IS 'OIDC 客户端注册表：记录允许接入的第三方应用配置';
-- Set comment to column: "client_id" on table: "oidc_clients"
COMMENT ON COLUMN "public"."oidc_clients"."client_id" IS '客户端唯一 ID';
-- Set comment to column: "client_secret" on table: "oidc_clients"
COMMENT ON COLUMN "public"."oidc_clients"."client_secret" IS '客户端密钥';
-- Set comment to column: "name" on table: "oidc_clients"
COMMENT ON COLUMN "public"."oidc_clients"."name" IS '客户端名称';
-- Set comment to column: "allowed_redirect_uris" on table: "oidc_clients"
COMMENT ON COLUMN "public"."oidc_clients"."allowed_redirect_uris" IS '允许的回调 URI 列表（JSON 数组）';
-- Set comment to column: "scopes" on table: "oidc_clients"
COMMENT ON COLUMN "public"."oidc_clients"."scopes" IS '允许的权限范围列表（JSON 数组）';
-- Set comment to column: "status" on table: "oidc_clients"
COMMENT ON COLUMN "public"."oidc_clients"."status" IS '状态（active/disabled）';
-- Set comment to column: "created_at" on table: "oidc_clients"
COMMENT ON COLUMN "public"."oidc_clients"."created_at" IS '创建时间';
-- Set comment to column: "updated_at" on table: "oidc_clients"
COMMENT ON COLUMN "public"."oidc_clients"."updated_at" IS '更新时间';
-- Create "homework_file" table
CREATE TABLE "public"."homework_file" (
  "id" serial NOT NULL,
  "target_type" character varying(50) NOT NULL,
  "target_id" integer NOT NULL,
  "file_name" character varying(255) NOT NULL,
  "file_path" character varying(512) NOT NULL,
  "file_size" bigint NOT NULL,
  "mime_type" character varying(100) NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- Set comment to table: "homework_file"
COMMENT ON TABLE "public"."homework_file" IS '作业附件表：存储作业发布或提交相关的附件信息';
-- Set comment to column: "id" on table: "homework_file"
COMMENT ON COLUMN "public"."homework_file"."id" IS '主键 ID';
-- Set comment to column: "target_type" on table: "homework_file"
COMMENT ON COLUMN "public"."homework_file"."target_type" IS '关联目标类型（homework/submission）';
-- Set comment to column: "target_id" on table: "homework_file"
COMMENT ON COLUMN "public"."homework_file"."target_id" IS '关联目标 ID';
-- Set comment to column: "file_name" on table: "homework_file"
COMMENT ON COLUMN "public"."homework_file"."file_name" IS '原始文件名';
-- Set comment to column: "file_path" on table: "homework_file"
COMMENT ON COLUMN "public"."homework_file"."file_path" IS '存储系统路径';
-- Set comment to column: "file_size" on table: "homework_file"
COMMENT ON COLUMN "public"."homework_file"."file_size" IS '文件大小（字节）';
-- Set comment to column: "mime_type" on table: "homework_file"
COMMENT ON COLUMN "public"."homework_file"."mime_type" IS '文件 MIME 类型';
-- Set comment to column: "created_at" on table: "homework_file"
COMMENT ON COLUMN "public"."homework_file"."created_at" IS '创建时间';
-- Create "attendance_task" table
CREATE TABLE "public"."attendance_task" (
  "id" serial NOT NULL,
  "course_id" integer NOT NULL,
  "title" character varying(255) NOT NULL,
  "start_time" timestamptz NOT NULL,
  "end_time" timestamptz NOT NULL,
  "code" character varying(10) NULL,
  "status" integer NOT NULL DEFAULT 1,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "attendance_task_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Set comment to table: "attendance_task"
COMMENT ON TABLE "public"."attendance_task" IS '考勤任务：定义某节课或某次活动的考勤规则';
-- Set comment to column: "id" on table: "attendance_task"
COMMENT ON COLUMN "public"."attendance_task"."id" IS '主键 ID';
-- Set comment to column: "course_id" on table: "attendance_task"
COMMENT ON COLUMN "public"."attendance_task"."course_id" IS '关联课程 ID';
-- Set comment to column: "title" on table: "attendance_task"
COMMENT ON COLUMN "public"."attendance_task"."title" IS '考勤标题';
-- Set comment to column: "start_time" on table: "attendance_task"
COMMENT ON COLUMN "public"."attendance_task"."start_time" IS '允许签到开始时间';
-- Set comment to column: "end_time" on table: "attendance_task"
COMMENT ON COLUMN "public"."attendance_task"."end_time" IS '允许签到结束时间';
-- Set comment to column: "code" on table: "attendance_task"
COMMENT ON COLUMN "public"."attendance_task"."code" IS '签到码（可选）';
-- Set comment to column: "status" on table: "attendance_task"
COMMENT ON COLUMN "public"."attendance_task"."status" IS '任务状态（1 开启，0 关闭）';
-- Set comment to column: "created_at" on table: "attendance_task"
COMMENT ON COLUMN "public"."attendance_task"."created_at" IS '创建时间';
-- Set comment to column: "updated_at" on table: "attendance_task"
COMMENT ON COLUMN "public"."attendance_task"."updated_at" IS '更新时间';
-- Create "user" table
CREATE TABLE "public"."user" (
  "id" serial NOT NULL,
  "username" character varying(50) NOT NULL,
  "password" character varying(255) NOT NULL,
  "real_name" character varying(255) NOT NULL,
  "student_id" character varying(11) NOT NULL,
  "enrollment_year" integer NOT NULL,
  "major" character varying(100) NOT NULL,
  "status" integer NOT NULL DEFAULT 1,
  "weak_password_flag" boolean NOT NULL DEFAULT false,
  "email" character varying(255) NULL,
  "phone" character varying(20) NULL,
  "roles" jsonb NOT NULL DEFAULT '[]',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "user_email_key" UNIQUE ("email"),
  CONSTRAINT "user_phone_key" UNIQUE ("phone"),
  CONSTRAINT "user_student_id_key" UNIQUE ("student_id"),
  CONSTRAINT "user_username_key" UNIQUE ("username")
);
-- Set comment to table: "user"
COMMENT ON TABLE "public"."user" IS '用户基础信息表：存储登录账号及核心个人信息';
-- Set comment to column: "id" on table: "user"
COMMENT ON COLUMN "public"."user"."id" IS '主键 ID';
-- Set comment to column: "username" on table: "user"
COMMENT ON COLUMN "public"."user"."username" IS '登录用户名';
-- Set comment to column: "password" on table: "user"
COMMENT ON COLUMN "public"."user"."password" IS '加密后的密码';
-- Set comment to column: "real_name" on table: "user"
COMMENT ON COLUMN "public"."user"."real_name" IS '真实姓名';
-- Set comment to column: "student_id" on table: "user"
COMMENT ON COLUMN "public"."user"."student_id" IS '学号';
-- Set comment to column: "enrollment_year" on table: "user"
COMMENT ON COLUMN "public"."user"."enrollment_year" IS '入学年份';
-- Set comment to column: "major" on table: "user"
COMMENT ON COLUMN "public"."user"."major" IS '专业';
-- Set comment to column: "status" on table: "user"
COMMENT ON COLUMN "public"."user"."status" IS '状态：1-启用，0-禁用';
-- Set comment to column: "weak_password_flag" on table: "user"
COMMENT ON COLUMN "public"."user"."weak_password_flag" IS '弱密码标识';
-- Set comment to column: "email" on table: "user"
COMMENT ON COLUMN "public"."user"."email" IS '邮箱';
-- Set comment to column: "phone" on table: "user"
COMMENT ON COLUMN "public"."user"."phone" IS '手机号';
-- Set comment to column: "roles" on table: "user"
COMMENT ON COLUMN "public"."user"."roles" IS '用户角色列表';
-- Set comment to column: "created_at" on table: "user"
COMMENT ON COLUMN "public"."user"."created_at" IS '创建时间';
-- Set comment to column: "updated_at" on table: "user"
COMMENT ON COLUMN "public"."user"."updated_at" IS '更新时间';
-- Create "attendance_record" table
CREATE TABLE "public"."attendance_record" (
  "id" serial NOT NULL,
  "task_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "checkin_time" timestamptz NOT NULL,
  "status" character varying(50) NOT NULL DEFAULT 'present',
  "ip_address" character varying(50) NULL,
  "device_info" text NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "attendance_record_task_id_user_id_uk" UNIQUE ("task_id", "user_id"),
  CONSTRAINT "attendance_record_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."attendance_task" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "attendance_record_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Set comment to table: "attendance_record"
COMMENT ON TABLE "public"."attendance_record" IS '考勤签到记录：记录用户针对某考勤任务的签到结果';
-- Set comment to column: "id" on table: "attendance_record"
COMMENT ON COLUMN "public"."attendance_record"."id" IS '主键 ID';
-- Set comment to column: "task_id" on table: "attendance_record"
COMMENT ON COLUMN "public"."attendance_record"."task_id" IS '关联考勤任务 ID';
-- Set comment to column: "user_id" on table: "attendance_record"
COMMENT ON COLUMN "public"."attendance_record"."user_id" IS '关联用户 ID';
-- Set comment to column: "checkin_time" on table: "attendance_record"
COMMENT ON COLUMN "public"."attendance_record"."checkin_time" IS '签到时间';
-- Set comment to column: "status" on table: "attendance_record"
COMMENT ON COLUMN "public"."attendance_record"."status" IS '签到状态（present-出勤，late-迟到，absent-缺勤）';
-- Set comment to column: "ip_address" on table: "attendance_record"
COMMENT ON COLUMN "public"."attendance_record"."ip_address" IS '签到时的 IP 地址';
-- Set comment to column: "device_info" on table: "attendance_record"
COMMENT ON COLUMN "public"."attendance_record"."device_info" IS '签到设备信息';
-- Set comment to column: "created_at" on table: "attendance_record"
COMMENT ON COLUMN "public"."attendance_record"."created_at" IS '创建时间';
-- Set comment to column: "updated_at" on table: "attendance_record"
COMMENT ON COLUMN "public"."attendance_record"."updated_at" IS '更新时间';
-- Create "class" table
CREATE TABLE "public"."class" (
  "id" serial NOT NULL,
  "course_id" integer NOT NULL,
  "name" character varying(100) NOT NULL,
  "code" character varying(50) NOT NULL,
  "capacity" integer NOT NULL DEFAULT 0,
  "status" integer NOT NULL DEFAULT 1,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "class_code_key" UNIQUE ("code"),
  CONSTRAINT "class_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Set comment to table: "class"
COMMENT ON TABLE "public"."class" IS '教学班级表：定义某门课程下的具体教学班';
-- Set comment to column: "id" on table: "class"
COMMENT ON COLUMN "public"."class"."id" IS '主键 ID';
-- Set comment to column: "course_id" on table: "class"
COMMENT ON COLUMN "public"."class"."course_id" IS '所属课程 ID';
-- Set comment to column: "name" on table: "class"
COMMENT ON COLUMN "public"."class"."name" IS '班级名称';
-- Set comment to column: "code" on table: "class"
COMMENT ON COLUMN "public"."class"."code" IS '班级代码（唯一）';
-- Set comment to column: "capacity" on table: "class"
COMMENT ON COLUMN "public"."class"."capacity" IS '班级容量';
-- Set comment to column: "status" on table: "class"
COMMENT ON COLUMN "public"."class"."status" IS '状态（1 正常）';
-- Set comment to column: "created_at" on table: "class"
COMMENT ON COLUMN "public"."class"."created_at" IS '创建时间';
-- Set comment to column: "updated_at" on table: "class"
COMMENT ON COLUMN "public"."class"."updated_at" IS '更新时间';
-- Create "course_rep" table
CREATE TABLE "public"."course_rep" (
  "id" serial NOT NULL,
  "class_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "course_rep_class_id_user_id_uk" UNIQUE ("class_id", "user_id"),
  CONSTRAINT "course_rep_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."class" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "course_rep_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Set comment to table: "course_rep"
COMMENT ON TABLE "public"."course_rep" IS '课代表管理：记录班级的学生课代表信息';
-- Set comment to column: "id" on table: "course_rep"
COMMENT ON COLUMN "public"."course_rep"."id" IS '主键 ID';
-- Set comment to column: "class_id" on table: "course_rep"
COMMENT ON COLUMN "public"."course_rep"."class_id" IS '关联班级 ID';
-- Set comment to column: "user_id" on table: "course_rep"
COMMENT ON COLUMN "public"."course_rep"."user_id" IS '关联用户 ID';
-- Set comment to column: "created_at" on table: "course_rep"
COMMENT ON COLUMN "public"."course_rep"."created_at" IS '创建时间';
-- Set comment to column: "updated_at" on table: "course_rep"
COMMENT ON COLUMN "public"."course_rep"."updated_at" IS '更新时间';
-- Create "teacher" table
CREATE TABLE "public"."teacher" (
  "id" serial NOT NULL,
  "user_id" integer NULL,
  "real_name" character varying(255) NOT NULL,
  "email" character varying(255) NOT NULL,
  "phone" character varying(20) NOT NULL,
  "department" character varying(255) NOT NULL,
  "title" character varying(100) NULL,
  "status" integer NOT NULL DEFAULT 1,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "teacher_email_key" UNIQUE ("email"),
  CONSTRAINT "teacher_phone_key" UNIQUE ("phone"),
  CONSTRAINT "teacher_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user" ("id") ON UPDATE NO ACTION ON DELETE SET NULL
);
-- Set comment to table: "teacher"
COMMENT ON TABLE "public"."teacher" IS '教师表：记录教师的基本信息与所属院系';
-- Set comment to column: "id" on table: "teacher"
COMMENT ON COLUMN "public"."teacher"."id" IS '主键 ID';
-- Set comment to column: "user_id" on table: "teacher"
COMMENT ON COLUMN "public"."teacher"."user_id" IS '关联用户 ID（可空）';
-- Set comment to column: "real_name" on table: "teacher"
COMMENT ON COLUMN "public"."teacher"."real_name" IS '教师姓名';
-- Set comment to column: "email" on table: "teacher"
COMMENT ON COLUMN "public"."teacher"."email" IS '邮箱（唯一）';
-- Set comment to column: "phone" on table: "teacher"
COMMENT ON COLUMN "public"."teacher"."phone" IS '手机号（唯一）';
-- Set comment to column: "department" on table: "teacher"
COMMENT ON COLUMN "public"."teacher"."department" IS '所属院系';
-- Set comment to column: "title" on table: "teacher"
COMMENT ON COLUMN "public"."teacher"."title" IS '职称（可空）';
-- Set comment to column: "status" on table: "teacher"
COMMENT ON COLUMN "public"."teacher"."status" IS '状态（1 正常）';
-- Set comment to column: "created_at" on table: "teacher"
COMMENT ON COLUMN "public"."teacher"."created_at" IS '创建时间';
-- Set comment to column: "updated_at" on table: "teacher"
COMMENT ON COLUMN "public"."teacher"."updated_at" IS '更新时间';
-- Create "course_teacher" table
CREATE TABLE "public"."course_teacher" (
  "id" serial NOT NULL,
  "class_id" integer NOT NULL,
  "teacher_id" integer NOT NULL,
  "is_primary" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "course_teacher_class_id_teacher_id_uk" UNIQUE ("class_id", "teacher_id"),
  CONSTRAINT "course_teacher_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."class" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "course_teacher_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."teacher" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Set comment to table: "course_teacher"
COMMENT ON TABLE "public"."course_teacher" IS '课程教师关联：记录班级与任课教师的多对多关系';
-- Set comment to column: "id" on table: "course_teacher"
COMMENT ON COLUMN "public"."course_teacher"."id" IS '主键 ID';
-- Set comment to column: "class_id" on table: "course_teacher"
COMMENT ON COLUMN "public"."course_teacher"."class_id" IS '关联班级 ID';
-- Set comment to column: "teacher_id" on table: "course_teacher"
COMMENT ON COLUMN "public"."course_teacher"."teacher_id" IS '关联教师 ID';
-- Set comment to column: "is_primary" on table: "course_teacher"
COMMENT ON COLUMN "public"."course_teacher"."is_primary" IS '是否为主讲教师';
-- Set comment to column: "created_at" on table: "course_teacher"
COMMENT ON COLUMN "public"."course_teacher"."created_at" IS '创建时间';
-- Set comment to column: "updated_at" on table: "course_teacher"
COMMENT ON COLUMN "public"."course_teacher"."updated_at" IS '更新时间';
-- Create "homework" table
CREATE TABLE "public"."homework" (
  "id" serial NOT NULL,
  "class_id" integer NOT NULL,
  "title" character varying(255) NOT NULL,
  "content" text NULL,
  "deadline" timestamptz NOT NULL,
  "status" integer NOT NULL DEFAULT 1,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "homework_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."class" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Set comment to table: "homework"
COMMENT ON TABLE "public"."homework" IS '作业发布表：记录班级的作业发布信息';
-- Set comment to column: "id" on table: "homework"
COMMENT ON COLUMN "public"."homework"."id" IS '主键 ID';
-- Set comment to column: "class_id" on table: "homework"
COMMENT ON COLUMN "public"."homework"."class_id" IS '所属班级 ID';
-- Set comment to column: "title" on table: "homework"
COMMENT ON COLUMN "public"."homework"."title" IS '作业标题';
-- Set comment to column: "content" on table: "homework"
COMMENT ON COLUMN "public"."homework"."content" IS '作业详细内容';
-- Set comment to column: "deadline" on table: "homework"
COMMENT ON COLUMN "public"."homework"."deadline" IS '截止提交时间';
-- Set comment to column: "status" on table: "homework"
COMMENT ON COLUMN "public"."homework"."status" IS '状态（1 发布，0 暂存）';
-- Set comment to column: "created_at" on table: "homework"
COMMENT ON COLUMN "public"."homework"."created_at" IS '创建时间';
-- Set comment to column: "updated_at" on table: "homework"
COMMENT ON COLUMN "public"."homework"."updated_at" IS '更新时间';
-- Create "homework_submission" table
CREATE TABLE "public"."homework_submission" (
  "id" serial NOT NULL,
  "homework_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "content" text NULL,
  "score" numeric(5,2) NULL,
  "comment" text NULL,
  "status" integer NOT NULL DEFAULT 1,
  "submitted_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "homework_submission_homework_id_user_id_uk" UNIQUE ("homework_id", "user_id"),
  CONSTRAINT "homework_submission_homework_id_fkey" FOREIGN KEY ("homework_id") REFERENCES "public"."homework" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "homework_submission_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Set comment to table: "homework_submission"
COMMENT ON TABLE "public"."homework_submission" IS '作业提交记录：学生提交作业的具体内容与评分';
-- Set comment to column: "id" on table: "homework_submission"
COMMENT ON COLUMN "public"."homework_submission"."id" IS '主键 ID';
-- Set comment to column: "homework_id" on table: "homework_submission"
COMMENT ON COLUMN "public"."homework_submission"."homework_id" IS '关联作业 ID';
-- Set comment to column: "user_id" on table: "homework_submission"
COMMENT ON COLUMN "public"."homework_submission"."user_id" IS '关联学生用户 ID';
-- Set comment to column: "content" on table: "homework_submission"
COMMENT ON COLUMN "public"."homework_submission"."content" IS '提交文本内容';
-- Set comment to column: "score" on table: "homework_submission"
COMMENT ON COLUMN "public"."homework_submission"."score" IS '作业评分';
-- Set comment to column: "comment" on table: "homework_submission"
COMMENT ON COLUMN "public"."homework_submission"."comment" IS '教师评语';
-- Set comment to column: "status" on table: "homework_submission"
COMMENT ON COLUMN "public"."homework_submission"."status" IS '状态（1 已提交，2 已批改）';
-- Set comment to column: "submitted_at" on table: "homework_submission"
COMMENT ON COLUMN "public"."homework_submission"."submitted_at" IS '提交时间';
-- Set comment to column: "updated_at" on table: "homework_submission"
COMMENT ON COLUMN "public"."homework_submission"."updated_at" IS '更新时间';
-- Create "mfa_settings" table
CREATE TABLE "public"."mfa_settings" (
  "id" serial NOT NULL,
  "user_id" integer NOT NULL,
  "otp_secret" character varying(255) NULL,
  "otp_enabled" boolean NOT NULL DEFAULT false,
  "sms_enabled" boolean NOT NULL DEFAULT false,
  "email_enabled" boolean NOT NULL DEFAULT false,
  "fido2_enabled" boolean NOT NULL DEFAULT false,
  "phone_number" character varying(20) NULL,
  "required" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "mfa_settings_user_id_key" UNIQUE ("user_id"),
  CONSTRAINT "mfa_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Set comment to table: "mfa_settings"
COMMENT ON TABLE "public"."mfa_settings" IS '多因子认证配置表：记录用户 MFA 密钥与细分启用状态';
-- Set comment to column: "id" on table: "mfa_settings"
COMMENT ON COLUMN "public"."mfa_settings"."id" IS '主键 ID';
-- Set comment to column: "user_id" on table: "mfa_settings"
COMMENT ON COLUMN "public"."mfa_settings"."user_id" IS '关联用户 ID';
-- Set comment to column: "otp_secret" on table: "mfa_settings"
COMMENT ON COLUMN "public"."mfa_settings"."otp_secret" IS 'OTP 共享密钥';
-- Set comment to column: "otp_enabled" on table: "mfa_settings"
COMMENT ON COLUMN "public"."mfa_settings"."otp_enabled" IS '是否启用 OTP';
-- Set comment to column: "sms_enabled" on table: "mfa_settings"
COMMENT ON COLUMN "public"."mfa_settings"."sms_enabled" IS '是否启用短信认证';
-- Set comment to column: "email_enabled" on table: "mfa_settings"
COMMENT ON COLUMN "public"."mfa_settings"."email_enabled" IS '是否启用邮件认证';
-- Set comment to column: "fido2_enabled" on table: "mfa_settings"
COMMENT ON COLUMN "public"."mfa_settings"."fido2_enabled" IS '是否启用 FIDO2/WebAuthn';
-- Set comment to column: "phone_number" on table: "mfa_settings"
COMMENT ON COLUMN "public"."mfa_settings"."phone_number" IS 'MFA 绑定的手机号（若与账号不同）';
-- Set comment to column: "required" on table: "mfa_settings"
COMMENT ON COLUMN "public"."mfa_settings"."required" IS '是否强制要求 MFA';
-- Set comment to column: "created_at" on table: "mfa_settings"
COMMENT ON COLUMN "public"."mfa_settings"."created_at" IS '创建时间';
-- Set comment to column: "updated_at" on table: "mfa_settings"
COMMENT ON COLUMN "public"."mfa_settings"."updated_at" IS '更新时间';
-- Create "notification" table
CREATE TABLE "public"."notification" (
  "id" serial NOT NULL,
  "type" character varying(50) NOT NULL,
  "title" character varying(255) NOT NULL,
  "content" text NOT NULL,
  "target_user_id" integer NOT NULL,
  "sender_id" integer NOT NULL,
  "status" character varying(20) NOT NULL DEFAULT 'unread',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "notification_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "public"."user" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Set comment to table: "notification"
COMMENT ON TABLE "public"."notification" IS '系统通知表：记录用户收到的通知信息';
-- Set comment to column: "id" on table: "notification"
COMMENT ON COLUMN "public"."notification"."id" IS '主键 ID';
-- Set comment to column: "type" on table: "notification"
COMMENT ON COLUMN "public"."notification"."type" IS '通知类型';
-- Set comment to column: "title" on table: "notification"
COMMENT ON COLUMN "public"."notification"."title" IS '通知标题';
-- Set comment to column: "content" on table: "notification"
COMMENT ON COLUMN "public"."notification"."content" IS '通知正文';
-- Set comment to column: "target_user_id" on table: "notification"
COMMENT ON COLUMN "public"."notification"."target_user_id" IS '接收用户 ID';
-- Set comment to column: "sender_id" on table: "notification"
COMMENT ON COLUMN "public"."notification"."sender_id" IS '发送者 ID（系统发送可为 0）';
-- Set comment to column: "status" on table: "notification"
COMMENT ON COLUMN "public"."notification"."status" IS '状态（unread/read）';
-- Set comment to column: "created_at" on table: "notification"
COMMENT ON COLUMN "public"."notification"."created_at" IS '创建时间';
-- Set comment to column: "updated_at" on table: "notification"
COMMENT ON COLUMN "public"."notification"."updated_at" IS '更新时间';
-- Create "password_resets" table
CREATE TABLE "public"."password_resets" (
  "id" serial NOT NULL,
  "user_id" integer NOT NULL,
  "token_hash" character varying(255) NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "used" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "password_resets_token_hash_idx" to table: "password_resets"
CREATE INDEX "password_resets_token_hash_idx" ON "public"."password_resets" ("token_hash");
-- Set comment to table: "password_resets"
COMMENT ON TABLE "public"."password_resets" IS '重置密码记录：存储重置令牌与有效期';
-- Set comment to column: "id" on table: "password_resets"
COMMENT ON COLUMN "public"."password_resets"."id" IS '主键 ID';
-- Set comment to column: "user_id" on table: "password_resets"
COMMENT ON COLUMN "public"."password_resets"."user_id" IS '关联用户 ID';
-- Set comment to column: "token_hash" on table: "password_resets"
COMMENT ON COLUMN "public"."password_resets"."token_hash" IS '重置令牌哈希';
-- Set comment to column: "expires_at" on table: "password_resets"
COMMENT ON COLUMN "public"."password_resets"."expires_at" IS '过期时间';
-- Set comment to column: "used" on table: "password_resets"
COMMENT ON COLUMN "public"."password_resets"."used" IS '是否已使用';
-- Set comment to column: "created_at" on table: "password_resets"
COMMENT ON COLUMN "public"."password_resets"."created_at" IS '创建时间';
-- Set comment to column: "updated_at" on table: "password_resets"
COMMENT ON COLUMN "public"."password_resets"."updated_at" IS '更新时间';
-- Create "permission" table
CREATE TABLE "public"."permission" (
  "id" serial NOT NULL,
  "name" character varying(100) NOT NULL,
  "code" character varying(100) NOT NULL,
  "description" text NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "permission_code_key" UNIQUE ("code")
);
-- Set comment to table: "permission"
COMMENT ON TABLE "public"."permission" IS '权限项定义表：记录系统原子功能权限';
-- Set comment to column: "id" on table: "permission"
COMMENT ON COLUMN "public"."permission"."id" IS '主键 ID';
-- Set comment to column: "name" on table: "permission"
COMMENT ON COLUMN "public"."permission"."name" IS '权限名称';
-- Set comment to column: "code" on table: "permission"
COMMENT ON COLUMN "public"."permission"."code" IS '权限代码（唯一，如 user:create）';
-- Set comment to column: "description" on table: "permission"
COMMENT ON COLUMN "public"."permission"."description" IS '权限详细描述';
-- Set comment to column: "created_at" on table: "permission"
COMMENT ON COLUMN "public"."permission"."created_at" IS '创建时间';
-- Set comment to column: "updated_at" on table: "permission"
COMMENT ON COLUMN "public"."permission"."updated_at" IS '更新时间';
-- Create "role" table
CREATE TABLE "public"."role" (
  "id" serial NOT NULL,
  "name" character varying(50) NOT NULL,
  "code" character varying(50) NOT NULL,
  "description" text NULL,
  "status" integer NOT NULL DEFAULT 1,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "role_code_key" UNIQUE ("code"),
  CONSTRAINT "role_name_key" UNIQUE ("name")
);
-- Set comment to table: "role"
COMMENT ON TABLE "public"."role" IS '角色表：定义系统角色与权限聚合';
-- Set comment to column: "id" on table: "role"
COMMENT ON COLUMN "public"."role"."id" IS '主键 ID';
-- Set comment to column: "name" on table: "role"
COMMENT ON COLUMN "public"."role"."name" IS '角色名称（唯一）';
-- Set comment to column: "code" on table: "role"
COMMENT ON COLUMN "public"."role"."code" IS '角色编码（唯一）';
-- Set comment to column: "description" on table: "role"
COMMENT ON COLUMN "public"."role"."description" IS '角色描述';
-- Set comment to column: "status" on table: "role"
COMMENT ON COLUMN "public"."role"."status" IS '状态（1 正常）';
-- Set comment to column: "created_at" on table: "role"
COMMENT ON COLUMN "public"."role"."created_at" IS '创建时间';
-- Set comment to column: "updated_at" on table: "role"
COMMENT ON COLUMN "public"."role"."updated_at" IS '更新时间';
-- Create "role_permission" table
CREATE TABLE "public"."role_permission" (
  "id" serial NOT NULL,
  "role_id" integer NOT NULL,
  "permission_id" integer NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "role_permission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permission" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "role_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."role" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Set comment to table: "role_permission"
COMMENT ON TABLE "public"."role_permission" IS '角色-权限关联表：角色与权限的多对多关系';
-- Set comment to column: "id" on table: "role_permission"
COMMENT ON COLUMN "public"."role_permission"."id" IS '主键 ID';
-- Set comment to column: "role_id" on table: "role_permission"
COMMENT ON COLUMN "public"."role_permission"."role_id" IS '角色 ID';
-- Set comment to column: "permission_id" on table: "role_permission"
COMMENT ON COLUMN "public"."role_permission"."permission_id" IS '权限 ID';
-- Create "time_slot" table
CREATE TABLE "public"."time_slot" (
  "id" serial NOT NULL,
  "course_id" integer NOT NULL,
  "week_day" integer NOT NULL,
  "start_time" character varying(10) NOT NULL,
  "end_time" character varying(10) NOT NULL,
  "location" character varying(255) NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "time_slot_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Set comment to table: "time_slot"
COMMENT ON TABLE "public"."time_slot" IS '上课时间片表：记录课程的周次与时间段安排';
-- Set comment to column: "id" on table: "time_slot"
COMMENT ON COLUMN "public"."time_slot"."id" IS '主键 ID';
-- Set comment to column: "course_id" on table: "time_slot"
COMMENT ON COLUMN "public"."time_slot"."course_id" IS '课程 ID';
-- Set comment to column: "week_day" on table: "time_slot"
COMMENT ON COLUMN "public"."time_slot"."week_day" IS '星期（1-7）';
-- Set comment to column: "start_time" on table: "time_slot"
COMMENT ON COLUMN "public"."time_slot"."start_time" IS '开始时间（HH:mm）';
-- Set comment to column: "end_time" on table: "time_slot"
COMMENT ON COLUMN "public"."time_slot"."end_time" IS '结束时间（HH:mm）';
-- Set comment to column: "location" on table: "time_slot"
COMMENT ON COLUMN "public"."time_slot"."location" IS '上课地点（可空）';
-- Set comment to column: "created_at" on table: "time_slot"
COMMENT ON COLUMN "public"."time_slot"."created_at" IS '创建时间';
-- Set comment to column: "updated_at" on table: "time_slot"
COMMENT ON COLUMN "public"."time_slot"."updated_at" IS '更新时间';
-- Create "schedule" table
CREATE TABLE "public"."schedule" (
  "id" serial NOT NULL,
  "class_id" integer NOT NULL,
  "weekday" integer NOT NULL,
  "time_slot_id" integer NOT NULL,
  "room" character varying(100) NOT NULL,
  "location" character varying(255) NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "schedule_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."class" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "schedule_time_slot_id_fkey" FOREIGN KEY ("time_slot_id") REFERENCES "public"."time_slot" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Set comment to table: "schedule"
COMMENT ON TABLE "public"."schedule" IS '课程课表安排：记录班级在某时间片的教室与地点';
-- Set comment to column: "id" on table: "schedule"
COMMENT ON COLUMN "public"."schedule"."id" IS '主键 ID';
-- Set comment to column: "class_id" on table: "schedule"
COMMENT ON COLUMN "public"."schedule"."class_id" IS '班级 ID';
-- Set comment to column: "weekday" on table: "schedule"
COMMENT ON COLUMN "public"."schedule"."weekday" IS '星期（1-7）';
-- Set comment to column: "time_slot_id" on table: "schedule"
COMMENT ON COLUMN "public"."schedule"."time_slot_id" IS '时间片 ID';
-- Set comment to column: "room" on table: "schedule"
COMMENT ON COLUMN "public"."schedule"."room" IS '教室';
-- Set comment to column: "location" on table: "schedule"
COMMENT ON COLUMN "public"."schedule"."location" IS '地点';
-- Create "sub_course" table
CREATE TABLE "public"."sub_course" (
  "id" serial NOT NULL,
  "course_id" integer NOT NULL,
  "sub_course_code" character varying(50) NOT NULL,
  "teacher_id" integer NOT NULL,
  "academic_year" integer NOT NULL,
  "status" integer NOT NULL DEFAULT 1,
  PRIMARY KEY ("id"),
  CONSTRAINT "sub_course_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "sub_course_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."teacher" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Set comment to table: "sub_course"
COMMENT ON TABLE "public"."sub_course" IS '分课程表：记录课程的分支/子课程信息与任课教师';
-- Set comment to column: "id" on table: "sub_course"
COMMENT ON COLUMN "public"."sub_course"."id" IS '主键 ID';
-- Set comment to column: "course_id" on table: "sub_course"
COMMENT ON COLUMN "public"."sub_course"."course_id" IS '课程 ID';
-- Set comment to column: "sub_course_code" on table: "sub_course"
COMMENT ON COLUMN "public"."sub_course"."sub_course_code" IS '子课程代号（唯一）';
-- Set comment to column: "teacher_id" on table: "sub_course"
COMMENT ON COLUMN "public"."sub_course"."teacher_id" IS '任课教师 ID';
-- Set comment to column: "academic_year" on table: "sub_course"
COMMENT ON COLUMN "public"."sub_course"."academic_year" IS '学年';
-- Set comment to column: "status" on table: "sub_course"
COMMENT ON COLUMN "public"."sub_course"."status" IS '状态（1 正常）';
-- Create "user_class" table
CREATE TABLE "public"."user_class" (
  "id" serial NOT NULL,
  "user_id" integer NOT NULL,
  "class_id" integer NOT NULL,
  "join_time" timestamptz NOT NULL DEFAULT now(),
  "status" integer NOT NULL DEFAULT 1,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "user_class_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."class" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "user_class_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Set comment to table: "user_class"
COMMENT ON TABLE "public"."user_class" IS '用户选课班级表：记录用户加入班级的关系与状态';
-- Set comment to column: "id" on table: "user_class"
COMMENT ON COLUMN "public"."user_class"."id" IS '主键 ID';
-- Set comment to column: "user_id" on table: "user_class"
COMMENT ON COLUMN "public"."user_class"."user_id" IS '用户 ID';
-- Set comment to column: "class_id" on table: "user_class"
COMMENT ON COLUMN "public"."user_class"."class_id" IS '班级 ID';
-- Set comment to column: "join_time" on table: "user_class"
COMMENT ON COLUMN "public"."user_class"."join_time" IS '加入时间';
-- Set comment to column: "status" on table: "user_class"
COMMENT ON COLUMN "public"."user_class"."status" IS '状态（1 正常）';
-- Set comment to column: "created_at" on table: "user_class"
COMMENT ON COLUMN "public"."user_class"."created_at" IS '创建时间';
-- Set comment to column: "updated_at" on table: "user_class"
COMMENT ON COLUMN "public"."user_class"."updated_at" IS '更新时间';
-- Create "user_role" table
CREATE TABLE "public"."user_role" (
  "user_id" integer NOT NULL,
  "role_id" integer NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("user_id", "role_id"),
  CONSTRAINT "user_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."role" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Set comment to table: "user_role"
COMMENT ON TABLE "public"."user_role" IS '用户角色关联表：用户与角色的多对多关联';
-- Set comment to column: "user_id" on table: "user_role"
COMMENT ON COLUMN "public"."user_role"."user_id" IS '用户 ID（复合主键）';
-- Set comment to column: "role_id" on table: "user_role"
COMMENT ON COLUMN "public"."user_role"."role_id" IS '角色 ID（复合主键）';
-- Set comment to column: "created_at" on table: "user_role"
COMMENT ON COLUMN "public"."user_role"."created_at" IS '创建时间';
-- Set comment to column: "updated_at" on table: "user_role"
COMMENT ON COLUMN "public"."user_role"."updated_at" IS '更新时间';
