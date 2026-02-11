table "mfa_settings" {
  schema = schema.public
  comment = "多因子认证配置表：记录用户 MFA 密钥与细分启用状态"
  column "id" {
    null = false
    type = serial
    comment = "主键 ID"
  }
  column "user_id" {
    null = false
    type = integer
    comment = "关联用户 ID"
  }
  column "otp_secret" {
    null = true
    type = character_varying(255)
    comment = "OTP 共享密钥"
  }
  column "otp_enabled" {
    null    = false
    type    = boolean
    default = false
    comment = "是否启用 OTP"
  }
  column "sms_enabled" {
    null    = false
    type    = boolean
    default = false
    comment = "是否启用短信认证"
  }
  column "email_enabled" {
    null    = false
    type    = boolean
    default = false
    comment = "是否启用邮件认证"
  }
  column "fido2_enabled" {
    null    = false
    type    = boolean
    default = false
    comment = "是否启用 FIDO2/WebAuthn"
  }
  column "phone_number" {
    null = true
    type = character_varying(20)
    comment = "MFA 绑定的手机号（若与账号不同）"
  }
  column "required" {
    null    = false
    type    = boolean
    default = false
    comment = "是否强制要求 MFA"
  }
  column "created_at" {
    null    = false
    type    = timestamptz
    default = sql("now()")
    comment = "创建时间"
  }
  column "updated_at" {
    null    = false
    type    = timestamptz
    default = sql("now()")
    comment = "更新时间"
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "mfa_settings_user_id_fkey" {
    columns     = [column.user_id]
    ref_columns = [table.user.column.id]
    on_update   = NO_ACTION
    on_delete   = CASCADE
  }
  unique "mfa_settings_user_id_key" {
    columns = [column.user_id]
  }
}
