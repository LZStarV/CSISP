import { Injectable } from '@nestjs/common';

@Injectable()
export class DemoService {
  echo<T>(params: T): T {
    return params;
  }
}
