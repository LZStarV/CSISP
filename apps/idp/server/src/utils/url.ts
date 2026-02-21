import { config } from '../config';

export function getApiBaseUrl(): string {
  return config.issuer.baseUrl;
}
