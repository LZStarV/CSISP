import { BackofficeController } from '@common/decorators/subproject.controller';
import { NotImplementedException, Post } from '@nestjs/common';

@BackofficeController('demo')
export class BackofficeDemoController {
  @Post(':action')
  notImplemented() {
    throw new NotImplementedException();
  }
}
