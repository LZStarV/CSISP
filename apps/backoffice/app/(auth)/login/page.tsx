'use client';
import { generatePKCE, generateState } from '@csisp/auth/browser';
import { AuthorizationInitResult, OIDCPKCEMethod } from '@csisp/idl/idp';
import { Button, Card, Typography, Space } from 'antd';

import { authConfig } from '@/src/client/config/auth';
import { authCall, hasError } from '@/src/client/utils/rpc-client';

export default function LoginPage() {
  const handleLogin = async () => {
    const state = generateState();
    const { verifier, challenge } = await generatePKCE();

    try {
      const response = await authCall<AuthorizationInitResult>('authorize', {
        state,
        code_challenge: challenge,
        code_verifier: verifier,
        code_challenge_method: OIDCPKCEMethod.S256,
      });

      if (!hasError(response)) {
        const target = response.result.ticket
          ? `${authConfig.idpLoginUrl}?ticket=${response.result.ticket}`
          : `${authConfig.idpLoginUrl}?state=${state}`;
        window.location.href = target;
      } else {
        const errorMsg = hasError(response)
          ? response.error.message
          : '响应状态异常';
        alert('登录初始化失败: ' + errorMsg);
      }
    } catch (error: any) {
      alert('登录初始化失败: ' + error.message);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '100px 16px',
      }}
    >
      <Card
        bordered
        style={{
          width: '100%',
          maxWidth: 400,
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <Space direction='vertical' size='large' style={{ width: '100%' }}>
          <Typography.Title level={2}>CSISP 管理后台</Typography.Title>
          <Typography.Text type='secondary'>
            请通过统一身份认证平台 (IdP) 登录
          </Typography.Text>
          <Button type='primary' size='large' onClick={handleLogin} block>
            跳转至 IdP 登录
          </Button>
        </Space>
      </Card>
    </div>
  );
}
