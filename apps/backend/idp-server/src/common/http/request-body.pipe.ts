import { getIdpLogger } from '@infra/logger';
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

type RequestBody = {
  [key: string]: unknown;
};

@Injectable()
export class RequestBodyPipe implements PipeTransform {
  transform(value: RequestBody | string | undefined) {
    const logger = getIdpLogger('request-body-pipe');
    let body: any = value;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        logger.warn(
          { bodyType: typeof value },
          'request body JSON parse failed'
        );
        body = undefined;
      }
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('Invalid request body');
    }
    const rawParams = body ?? {};
    const params: Record<string, any> = {};
    for (const key of Object.keys(rawParams)) {
      const fieldValue = (rawParams as any)[key];
      params[key] =
        typeof fieldValue === 'string' ? fieldValue.trim() : fieldValue;
    }
    return params;
  }
}
