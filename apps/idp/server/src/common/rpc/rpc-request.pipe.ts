import {
  OIDCResponseType,
  OIDCPKCEMethod,
  OIDCGrantType,
  OIDCScope,
} from '@csisp/idl/idp';
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { getIdpLogger } from '../../infra/logger';

type RpcBody = {
  jsonrpc?: string;
  id?: string | number | null;
  params?: Record<string, any>;
};

@Injectable()
export class RpcRequestPipe implements PipeTransform {
  /**
   * 统一 JSON‑RPC 请求体解析与最小运行时校验
   * - 支持字符串 JSON 输入
   * - 校验 jsonrpc 版本为 2.0
   * - 规范化 params：去除字符串首尾空格、按字段规则做长度/格式校验
   * - 对 OIDC 与 Auth 的关键字段做基础约束，避免非法值进入控制器和服务层
   */
  transform(value: RpcBody | string | undefined) {
    const logger = getIdpLogger('rpc-request-pipe');
    let body: any = value;
    // 若 body 为字符串，尝试解析为 JSON
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        logger.warn({ bodyType: typeof value }, 'rpc body JSON parse failed');
        body = undefined;
      }
    }
    const ver = body?.jsonrpc;
    logger.debug(
      { ver, bodySample: body && { id: body.id, hasParams: !!body.params } },
      'rpc body inspected'
    );
    if (ver !== '2.0' && String(ver) !== '2.0') {
      logger.warn({ ver }, 'invalid jsonrpc version');
      throw new BadRequestException('Invalid JSON-RPC version');
    }
    const id = body?.id ?? null;
    const rawParams = body?.params ?? {};
    const params: Record<string, any> = {};
    // 规范化第一步：去除所有字符串字段的首尾空格
    for (const key of Object.keys(rawParams)) {
      const fieldValue = (rawParams as any)[key];
      params[key] =
        typeof fieldValue === 'string' ? fieldValue.trim() : fieldValue;
    }
    // 通用字符串字段校验工具（必填/可选）
    const strField = (k: string, min = 0, max = 1024) => {
      const val = params[k];
      if (val === undefined || val === null) return undefined;
      if (typeof val !== 'string')
        throw new BadRequestException(`Invalid type for ${k}`);
      if (val.length < min || val.length > max)
        throw new BadRequestException(`Invalid length for ${k}`);
      return val;
    };
    const optStrField = (k: string, min = 0, max = 1024) => {
      const val = params[k];
      if (val === undefined || val === null) return undefined;
      if (typeof val !== 'string')
        throw new BadRequestException(`Invalid type for ${k}`);
      if (val.length < min || val.length > max)
        throw new BadRequestException(`Invalid length for ${k}`);
      return val;
    };
    const has = (k: string) => Object.prototype.hasOwnProperty.call(params, k);
    // Auth.enter：state/redirectMode
    if (has('state')) params.state = strField('state', 1, 256);
    if (has('redirectMode')) {
      const redirectModeValue = optStrField('redirectMode', 0, 16);
      if (redirectModeValue && redirectModeValue !== 'http')
        throw new BadRequestException('Invalid redirectMode');
      params.redirectMode = redirectModeValue;
    }
    // OIDC.authorize：response_type/code_challenge_method
    if (has('response_type')) {
      const rt = strField('response_type', 1, 16)?.toLowerCase();
      if (rt !== 'code') throw new BadRequestException('Invalid response_type');
      params.response_type = 'code';
      // IDL 枚举同步
      params._idl = params._idl ?? {};
      (params._idl as any).response_type_enum =
        OIDCResponseType.Code as OIDCResponseType;
    }
    if (has('code_challenge_method')) {
      const cm = strField('code_challenge_method', 3, 8);
      if (cm !== 'S256') throw new BadRequestException('PKCE S256 required');
      params.code_challenge_method = 'S256';
      params._idl = params._idl ?? {};
      (params._idl as any).code_challenge_method_enum =
        OIDCPKCEMethod.S256 as OIDCPKCEMethod;
    }
    // OIDC.token：grant_type/code_verifier/code
    if (has('grant_type')) {
      const gt = strField('grant_type', 6, 32)?.toLowerCase();
      if (gt !== 'authorization_code' && gt !== 'refresh_token')
        throw new BadRequestException('Invalid grant_type');
      params.grant_type = gt;
      params._idl = params._idl ?? {};
      (params._idl as any).grant_type_enum =
        gt === 'refresh_token'
          ? (OIDCGrantType.RefreshToken as OIDCGrantType)
          : (OIDCGrantType.AuthorizationCode as OIDCGrantType);
    }
    if (has('code_verifier'))
      params.code_verifier = strField('code_verifier', 8, 255);
    if (has('code')) params.code = strField('code', 1, 128);
    // 通用：client_id/redirect_uri
    if (has('client_id')) params.client_id = strField('client_id', 1, 128);
    if (has('redirect_uri'))
      params.redirect_uri = strField('redirect_uri', 1, 1024);
    // OIDC.scope：空格分隔 + 白名单
    if (has('scope')) {
      const s = strField('scope', 0, 1024) ?? '';
      const allowed = new Set(['openid', 'profile', 'email']);
      const tokens = s
        .split(' ')
        .map(t => t.trim())
        .filter(Boolean);
      for (const t of tokens) {
        if (!allowed.has(t))
          throw new BadRequestException(`Invalid scope: ${t}`);
      }
      params.scope = tokens.join(' ');
      params._idl = params._idl ?? {};
      (params._idl as any).scopes_enum = tokens.map(t => {
        switch (t) {
          case 'openid':
            return OIDCScope.Openid as OIDCScope;
          case 'profile':
            return OIDCScope.Profile as OIDCScope;
          case 'email':
            return OIDCScope.Email as OIDCScope;
          default:
            return OIDCScope.Openid as OIDCScope;
        }
      });
    }
    // Auth.multifactor：最小字段校验
    if (has('codeOrAssertion'))
      params.codeOrAssertion = strField('codeOrAssertion', 1, 64);
    if (has('phoneOrEmail'))
      params.phoneOrEmail = optStrField('phoneOrEmail', 0, 128);
    return { id, params };
  }
}
