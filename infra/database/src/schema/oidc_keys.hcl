table "oidc_keys" {
  schema = schema.public
  comment = "OIDC 签名密钥库：存储 JWKS 相关的非对称密钥"
  column "kid" {
    null = false
    type = character_varying(255)
    comment = "密钥 ID"
  }
  column "kty" {
    null = false
    type = character_varying(50)
    comment = "密钥类型（如 RSA）"
  }
  column "use" {
    null = false
    type = character_varying(50)
    comment = "用途（如 sig）"
  }
  column "alg" {
    null = false
    type = character_varying(50)
    comment = "算法（如 RS256）"
  }
  column "public_pem" {
    null = false
    type = text
    comment = "PEM 格式公钥"
  }
  column "private_pem_enc" {
    null = false
    type = text
    comment = "加密后的 PEM 格式私钥"
  }
  column "status" {
    null    = false
    type    = character_varying(20)
    default = "active"
    comment = "状态（active/rotated/expired）"
  }
  column "created_at" {
    null    = false
    type    = timestamptz
    default = sql("now()")
    comment = "创建时间"
  }
  primary_key {
    columns = [column.kid]
  }
}
