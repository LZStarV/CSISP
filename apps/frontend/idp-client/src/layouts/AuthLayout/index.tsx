import { Typography } from 'antd';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import styles from './style.module.scss';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ROUTE_LOGIN } from '@/routes/router';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
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
}: AuthLayoutProps) {
  const { t } = useTranslation('common');
  const location = useLocation();
  const isSignup = location.pathname === '/signup';
  return (
    <div className={styles['auth-layout']}>
      <div className={styles['auth-left']}>
        <div className={styles['auth-left-inner']}>
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
        <div className={styles['auth-top-right']}>
          <LanguageSwitcher />
          {isSignup ? (
            <Link to={ROUTE_LOGIN} className={styles['auth-link']}>
              {t('authLayout.backToLogin', '返回登录')}
            </Link>
          ) : (
            <Link to='/signup' className={styles['auth-link']}>
              {t('authLayout.register', '注册')}
            </Link>
          )}
        </div>
        <div className={styles['auth-content']}>{children}</div>
      </div>
    </div>
  );
}
