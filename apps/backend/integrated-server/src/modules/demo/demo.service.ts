import { MongoDemoRepository } from '@csisp/dal';
import {
  GetDemoInfoRequest,
  GetDemoInfoResponse,
  DemoInfo,
} from '@csisp-api/integrated-server';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DemoService {
  constructor(private readonly demoRepository: MongoDemoRepository) {}

  async getDemoInfo(request: GetDemoInfoRequest): Promise<GetDemoInfoResponse> {
    try {
      // MongoDB DAL 使用示例
      // 1. 创建一个 Demo 记录
      const newDemo = await this.demoRepository.create({
        demo: `Demo for ${request.demoId}`,
      });

      // 2. 查询所有 Demo
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const allDemos = await this.demoRepository.findAll();

      // 3. 根据 ID 查询
      const foundDemo = await this.demoRepository.findById(
        newDemo._id.toString()
      );

      // 构建响应
      const demoInfo: DemoInfo = {
        demoId: request.demoId,
        title: `Demo Title for ${request.demoId}`,
        description: `This is a demo description for ${request.demoId} (MongoDB record: ${foundDemo?.demo})`,
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
