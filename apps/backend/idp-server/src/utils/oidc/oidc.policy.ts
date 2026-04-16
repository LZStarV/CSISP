export enum OIDCScope {
  Openid = 'openid',
  Profile = 'profile',
  Email = 'email',
}

/**
 * OIDC 策略辅助工具
 */
export class OidcPolicyHelper {
  /**
   * 校验 Redirect URI 是否在白名单中
   * 支持处理数据库中存储的 JSON 数组或字符串
   */
  static isRedirectUriAllowed(
    uri: string,
    allowed: string[] | string | null
  ): boolean {
    if (!allowed) return false;

    let whitelist: string[] = [];
    if (Array.isArray(allowed)) {
      whitelist = allowed.filter(x => typeof x === 'string');
    } else if (typeof allowed === 'string') {
      try {
        const parsed = JSON.parse(allowed);
        if (Array.isArray(parsed)) {
          whitelist = parsed.filter(x => typeof x === 'string');
        } else {
          whitelist = [allowed];
        }
      } catch {
        whitelist = [allowed];
      }
    }
    return whitelist.includes(uri);
  }

  /**
   * 将 IDL Scope 枚举数组转换为 OIDC 标准的空格分隔字符串
   */
  static stringifyScopes(scopes: OIDCScope[] | any): string {
    if (!Array.isArray(scopes) || scopes.length === 0) {
      return 'openid';
    }

    return scopes
      .map(s => {
        if (typeof s === 'string') return s.toLowerCase();
        return String(s).toLowerCase();
      })
      .filter(Boolean)
      .join(' ');
  }
}
