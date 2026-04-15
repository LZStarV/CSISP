import { Controller } from '@nestjs/common';

export function SubprojectController(
  sub: 'portal' | 'admin' | 'backoffice',
  path?: string
): ClassDecorator {
  const prefix = path ? `api/${sub}/${path}` : `api/${sub}`;
  return Controller(prefix);
}

export const PortalController = (path?: string) =>
  SubprojectController('portal', path);
export const AdminController = (path?: string) =>
  SubprojectController('admin', path);
export const BackofficeController = (path?: string) =>
  SubprojectController('backoffice', path);
