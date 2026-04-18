import {
  GetDemoInfoRequest,
  GetDemoInfoResponse,
  DemoInfo,
} from '@csisp-api/integrated-server';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DemoService {
  async getDemoInfo(request: GetDemoInfoRequest): Promise<GetDemoInfoResponse> {
    try {
      // 模拟业务逻辑
      const demoInfo: DemoInfo = {
        demoId: request.demoId,
        title: `Demo Title for ${request.demoId}`,
        description: `This is a demo description for ${request.demoId}`,
        createTime: Date.now(),
      };

      // 如果请求需要额外信息，则添加扩展字段
      if (request.withExtra) {
        // 在实际实现中，这里可能包含更多业务逻辑
      }

      return {
        demoInfo,
        code: 200,
        message: 'Success',
      };
    } catch (error: unknown) {
      const err = error as Error;
      return {
        demoInfo: undefined,
        code: 500,
        message: err.message || 'Internal Server Error',
      };
    }
  }
}
