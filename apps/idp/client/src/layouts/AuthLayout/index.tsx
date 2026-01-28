import { Typography } from 'antd';
import { ReactNode } from 'react';

import styles from './style.module.scss';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  imagePrompt?: string;
  imageSize?:
    | 'square_hd'
    | 'square'
    | 'portrait_4_3'
    | 'portrait_16_9'
    | 'landscape_4_3'
    | 'landscape_16_9';
}

export function AuthLayout({
  children,
  title = 'CSISP SSO 登录系统',
  subtitle,
  imagePrompt = 'Modern%20education%20technology%20illustration%20with%20students%20and%20digital%20devices%2C%20clean%20minimalist%20design%2C%20blue%20and%20white%20color%20scheme',
  imageSize = 'landscape_4_3',
}: AuthLayoutProps) {
  return (
    <div className={styles['auth-layout']}>
      <div className={styles['auth-left']}>
        <div className={styles['auth-left-inner']}>
          <img
            src={`https://copilot-cn.bytedance.net/api/ide/v1/text_to_image?prompt=${imagePrompt}&image_size=${imageSize}`}
            alt={title}
            className={styles['auth-image']}
          />
          <Typography.Title level={2} style={{ color: '#fff', marginTop: 16 }}>
            {title}
          </Typography.Title>
          {subtitle && (
            <Typography.Text
              style={{ color: '#fff', fontSize: 16, marginTop: 8 }}
            >
              {subtitle}
            </Typography.Text>
          )}
        </div>
      </div>
      <div className={styles['auth-right']}>
        <div className={styles['auth-content']}>{children}</div>
      </div>
    </div>
  );
}
