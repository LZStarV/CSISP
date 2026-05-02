import { Module } from '@nestjs/common';

import { CommonOauth2Controller } from './oauth2.controller';

@Module({
  controllers: [CommonOauth2Controller],
})
export class CommonOauth2Module {}
