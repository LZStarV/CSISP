import { App } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';
import type { ModalStaticFunctions } from 'antd/es/modal/confirm';
import type { NotificationInstance } from 'antd/es/notification/interface';

export let message: MessageInstance;
export let notification: NotificationInstance;
export let modal: ModalStaticFunctions;

export const AntdGlobal = () => {
  const staticFunction = App.useApp();
  message = staticFunction.message;
  notification = staticFunction.notification;
  modal = staticFunction.modal as unknown as ModalStaticFunctions;
  return null;
};
