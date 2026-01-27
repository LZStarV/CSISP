import { MfaSettingsModel } from './mfa-settings.model';
import { PasswordResetsModel } from './password-resets.model';
import { UserModel } from './user.model';

export const POSTGRES_MODELS = [
  UserModel,
  MfaSettingsModel,
  PasswordResetsModel,
];

export { UserModel, MfaSettingsModel, PasswordResetsModel };
