import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';

/**
 * 用户模块
 *
 * 聚合用户相关的 Controller 与 Service，
 * 负责用户注册、登录、信息维护、角色管理等领域能力。
 */
@Module({
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
