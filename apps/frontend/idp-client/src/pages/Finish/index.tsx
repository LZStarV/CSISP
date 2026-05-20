import { Space, Typography, Button, Modal } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { commonAuthApi } from '@/api/common/auth';
import { useSessionStore } from '@/stores/session';

export function Finish() {
  const { t } = useTranslation();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const { userInfo, setSession, clearSession } = useSessionStore();

  const [userLabel, setUserLabel] = useState<string>(
    t('session.loggedIn', '已登录')
  );

  // 优先使用 store 中的用户信息
  useEffect(() => {
    if (userInfo) {
      const n = userInfo.name;
      const sid = userInfo.student_id;
      if (n && sid) setUserLabel(`${n}（${sid}）`);
      else if (sid) setUserLabel(`（${sid}）`);
      else if (n) setUserLabel(n);
    }
  }, [userInfo]);

  // 如果 store 中没有用户信息，才去请求
  useEffect(() => {
    if (!userInfo) {
      (async () => {
        try {
          const res = await commonAuthApi.session();
          const n = (res as any)?.name as string | undefined;
          const sid = (res as any)?.student_id as string | undefined;
          if (res?.logged) {
            setSession(true, { name: n, student_id: sid });
          }
          if (n && sid) setUserLabel(`${n}（${sid}）`);
          else if (sid) setUserLabel(`（${sid}）`);
          else if (n) setUserLabel(n);
        } catch {}
      })();
    }
  }, [userInfo, setSession]);

  const handleLogout = async () => {
    Modal.confirm({
      title: t('logout.title', '确认退出登录？'),
      onOk: async () => {
        try {
          await commonAuthApi.logout();
          sessionStorage.removeItem('idp_studentId');
          clearSession();
          navigate('/login');
        } catch (error) {
          setErrorMsg(
            error instanceof Error
              ? error.message
              : t('logout.failed', '退出失败，请重试')
          );
        }
      },
    });
  };

  return (
    <div style={{ maxWidth: 720, margin: '32px auto', textAlign: 'center' }}>
      <Space direction='vertical' style={{ width: '100%' }} size='middle'>
        <Space>
          <Typography.Text strong>{userLabel}</Typography.Text>
          <Button type='link' onClick={handleLogout}>
            {t('logout.submit', '退出登录')}
          </Button>
        </Space>
        <Typography.Title level={3}>
          {t('session.loggedInUnified', '已登录到统一身份认证')}
        </Typography.Title>
        {errorMsg && (
          <Typography.Text type='danger'>{errorMsg}</Typography.Text>
        )}
      </Space>
    </div>
  );
}
