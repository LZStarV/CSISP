import { Module } from '@nestjs/common';
import { ClsModule as NestClsModule } from 'nestjs-cls';

@Module({
  imports: [
    NestClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        setup: (cls, req, res) => {
          cls.set('req', req);
          cls.set('res', res);
        },
      },
    }),
  ],
  exports: [NestClsModule],
})
export class AppClsModule {}
