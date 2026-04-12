export type HttpError = {
  code: string;
  message: string;
  details?: unknown;
  traceId?: string;
  status?: number;
};

export type HttpSuccessResponse<T> = {
  result: T;
};

export type HttpErrorResponse = {
  error: HttpError;
};

export type HttpResponse<T> = HttpSuccessResponse<T> | HttpErrorResponse;
