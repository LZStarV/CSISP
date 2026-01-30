import { Alert, Button, Form, Input, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { call, hasError } from '@/api/rpc';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ROUTE_LOGIN } from '@/routes/router';

export function ResetPassword() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const sidFromQuery = params.get('studentId') || undefined;
  const tokenFromQuery = params.get('resetToken') || undefined;
  const { studentId: sidFromState, resetToken: tokenFromState } =
    (location.state || {}) as {
      studentId?: string;
      resetToken?: string;
    };
  const studentId = sidFromQuery ?? sidFromState ?? '';
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  useEffect(() => {
    (async () => {
      if (!studentId) return;
      const tokenCandidate =
        tokenFromQuery ??
        tokenFromState ??
        sessionStorage.getItem(`idp_reset_token:${studentId}`) ??
        '';
      if (!tokenCandidate) {
        navigate(ROUTE_LOGIN);
        return;
      }
    })();
  }, [studentId]);

  const onFinishReset = async () => {
    if (!studentId || !newPwd) return;
    if (confirmPwd !== newPwd) {
      setErrorMsg('两次输入的密码不一致');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const tokenFromStorage = sessionStorage.getItem(
        `idp_reset_token:${studentId}`
      );
      const resetToken =
        tokenFromQuery ?? tokenFromState ?? tokenFromStorage ?? '';
      if (!resetToken) throw new Error('缺少重置令牌，请重新进行验证');
      const res = await call<import('@csisp/idl/idp').Next>(
        'auth/reset_password',
        {
          studentId,
          newPassword: newPwd,
          reason: 'ForgetPassword',
          resetToken,
        }
      );
      if (hasError(res)) throw new Error(res.error.message || '重置失败');
      navigate(ROUTE_LOGIN);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '重置失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title='找回密码' subtitle='输入新密码完成重置'>
      <div style={{ maxWidth: 420, margin: '0 auto' }}>
        <Typography.Title level={3} style={{ textAlign: 'center' }}>
          设置新密码
        </Typography.Title>

        {errorMsg && (
          <Alert
            type='error'
            message={errorMsg}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form layout='vertical' disabled={loading} onFinish={onFinishReset}>
          <Form.Item label='学号'>
            <Input placeholder='请输入学号' value={studentId} disabled />
          </Form.Item>

          <Form.Item
            label='新密码'
            name='newPassword'
            rules={[
              { required: true, message: '新密码不能为空' },
              { min: 8, max: 64, message: '密码长度为8-64个字符' },
            ]}
          >
            <Input.Password
              placeholder='请输入新密码'
              value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
            />
          </Form.Item>
          <Form.Item
            label='确认新密码'
            name='confirmPassword'
            rules={[
              { required: true, message: '确认密码不能为空' },
              {
                validator: () => {
                  if (!confirmPwd || confirmPwd === newPwd)
                    return Promise.resolve();
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              },
            ]}
          >
            <Input.Password
              placeholder='请再次输入新密码'
              value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
            />
          </Form.Item>
          <Form.Item>
            <Button
              type='primary'
              htmlType='submit'
              block
              loading={loading}
              disabled={
                newPwd.length < 8 || !studentId || confirmPwd !== newPwd
              }
            >
              提交重置
            </Button>
          </Form.Item>
        </Form>
      </div>
    </AuthLayout>
  );
}
