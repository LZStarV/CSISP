import { Button, Result, Spin, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { config } from '@/config';
import { ROUTE_LOGIN } from '@/routes/router';

const REDIRECT_DELAY_MS = 2000;

export function Finish() {
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState(REDIRECT_DELAY_MS / 1000);
  const [targetUrl, setTargetUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = config.defaultRedirectUrl;
    if (!url) {
      return;
    }
    setTargetUrl(url);

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          window.location.href = url;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!targetUrl) {
    return (
      <Result
        status='info'
        title={t('finish.loginSuccess', '登录成功')}
        subTitle={t('finish.noRedirect', '未配置默认跳转应用')}
        extra={
          <Button type='primary' href={ROUTE_LOGIN}>
            {t('finish.backToLogin', '返回登录')}
          </Button>
        }
      />
    );
  }

  return (
    <Result
      icon={<Spin size='large' />}
      title={t('finish.loginSuccess', '登录成功')}
      subTitle={
        <Typography.Text>
          {t('finish.redirecting', '正在前往目标应用...')}
          <Typography.Text type='secondary' style={{ marginLeft: 8 }}>
            ({countdown}s)
          </Typography.Text>
        </Typography.Text>
      }
      extra={[
        <Button key='go' type='primary' href={targetUrl}>
          {t('finish.goNow', '立即前往')}
        </Button>,
        <Button key='cancel' href={ROUTE_LOGIN}>
          {t('finish.cancel', '取消')}
        </Button>,
      ]}
    />
  );
}
