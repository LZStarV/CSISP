import {
  CommonApiException,
  CommonErrorCode,
} from '@common/errors/common-error-codes';
import { getIdpLogger } from '@infra/logger';
import { Injectable, PipeTransform, HttpStatus } from '@nestjs/common';

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
      throw new CommonApiException(
        CommonErrorCode.BadRequest,
        'Invalid request body',
        HttpStatus.BAD_REQUEST
      );
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
