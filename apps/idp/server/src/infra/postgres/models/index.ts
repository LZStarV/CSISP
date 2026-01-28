import { MfaSettingsModel } from './mfa-settings.model';
import { OidcClientModel } from './oidc-client.model';
import { OidcKeyModel } from './oidc-key.model';
import { PasswordResetsModel } from './password-resets.model';
import { RefreshTokenModel } from './refresh-token.model';
import { UserModel } from './user.model';

export const POSTGRES_MODELS = [
  UserModel,
  MfaSettingsModel,
  PasswordResetsModel,
  OidcKeyModel,
  OidcClientModel,
  RefreshTokenModel,
];

export {
  UserModel,
  MfaSettingsModel,
  PasswordResetsModel,
  OidcKeyModel,
  OidcClientModel,
  RefreshTokenModel,
};
