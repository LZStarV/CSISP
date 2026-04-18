import { config } from '@config';
import {
  ApiModule as IdpServerApiModule,
  Configuration,
} from '@csisp-api/bff-idp-server';
import { HttpModule, HttpService } from '@nestjs/axios';
import { Global, Module, OnModuleInit } from '@nestjs/common';
import type { AxiosResponse } from 'axios';
import type { Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';

@Global()
@Module({
  imports: [
    HttpModule,
    IdpServerApiModule.forRootAsync({
      useFactory: () => {
        return new Configuration({
          basePath: `${config.upstream.idpBaseUrl}/api/idp`,
        });
      },
    }),
  ],
  exports: [IdpServerApiModule],
})
export class UpstreamProxyModule implements OnModuleInit {
  constructor(
    private readonly httpService: HttpService,
    private readonly cls: ClsService
  ) {}

  onModuleInit() {
    const axios = this.httpService.axiosRef;

    // 上行拦截：将 CLS 中的 Headers (Cookie, Authorization, Trace-ID) 注入到发起给下游的 Axios 请求中
    axios.interceptors.request.use(axiosConfig => {
      const req = this.cls.get<Request>('req');
      if (req) {
        if (req.headers.cookie)
          axiosConfig.headers['cookie'] = req.headers.cookie;
        if (req.headers.authorization) {
          axiosConfig.headers['authorization'] = req.headers.authorization;
        }
        if (req.headers['x-trace-id']) {
          axiosConfig.headers['x-trace-id'] = req.headers['x-trace-id'];
        }
      }
      return axiosConfig;
    });

    // 下行拦截：将下游返回的 Set-Cookie 写回到 CLS 中的 Response 里
    axios.interceptors.response.use(
      response => {
        this.syncCookies(response);
        return response;
      },
      error => {
        // 发生错误时，如果带有 HTTP Response，也应当尝试同步 Cookie（比如 401 返回的清空会话 Cookie）
        if (error.response) {
          this.syncCookies(error.response);
        }
        return Promise.reject(error);
      }
    );
  }

  private syncCookies(response: AxiosResponse) {
    const res = this.cls.get<Response>('res');
    const newCookies = response.headers['set-cookie'];
    if (res && newCookies) {
      const existingCookies = res.getHeader('set-cookie');
      const existingArray = Array.isArray(existingCookies)
        ? existingCookies
        : existingCookies
          ? [String(existingCookies)]
          : [];
      const newArray = Array.isArray(newCookies)
        ? newCookies
        : [String(newCookies)];
      res.setHeader('set-cookie', [...existingArray, ...newArray]);
    }
  }
}
