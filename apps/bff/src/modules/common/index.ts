import { CommonAuthModule } from './auth/auth.module';
import { CommonOauth2Module } from './oauth2/oauth2.module';

export { CommonAuthModule } from './auth/auth.module';
export { CommonOauth2Module } from './oauth2/oauth2.module';

export const CommonModules = [CommonAuthModule, CommonOauth2Module];
