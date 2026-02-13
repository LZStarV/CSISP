import React, { useEffect } from 'react';

import { useAuth } from './useAuth';

export interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, fallback }) => {
  const { isAuthenticated, loading, login } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      login();
    }
  }, [loading, isAuthenticated, login]);

  if (loading) {
    return <>{fallback || <div>正在加载身份信息...</div>}</>;
  }

  if (!isAuthenticated) {
    // 正在跳转到登录页，或者登录页初始化中
    return null;
  }

  return <>{children}</>;
};
