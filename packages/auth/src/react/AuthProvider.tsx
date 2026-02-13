import type {
  AuthorizationInitResult,
  TokenResponse,
  UserInfo,
} from '@csisp/idl/idp';
import { oidc } from '@csisp/idl/idp';
import { call, hasError } from '@csisp/rpc/client-fetch';
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { generatePKCE, generateState } from '../browser/pkce';

export type AuthUser = UserInfo;

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
}

export interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  handleCallback: (code: string, state: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export interface AuthProviderProps {
  clientId: string;
  apiPrefix?: string; // e.g. '/api/idp'
  loginUrl: string; // e.g. 'http://localhost:5174/login'
  redirectUri: string;
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  clientId,
  apiPrefix = '/api/idp',
  loginUrl,
  redirectUri,
  children,
}) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
  });

  const fetchUser = useCallback(async () => {
    try {
      const res = await call<UserInfo>(
        apiPrefix,
        oidc.serviceName,
        'userinfo',
        {
          access_token: '', // Session-based auth might not need this if using cookies
        }
      );

      if (!hasError(res)) {
        setState({
          user: res.result,
          loading: false,
          error: null,
          isAuthenticated: true,
        });
      } else {
        setState(s => ({ ...s, loading: false, isAuthenticated: false }));
      }
    } catch (err) {
      setState({
        user: null,
        loading: false,
        error: err as Error,
        isAuthenticated: false,
      });
    }
  }, [apiPrefix]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async () => {
    try {
      const authState = generateState();
      const { verifier, challenge } = await generatePKCE();

      // Store verifier in session storage for callback handling
      sessionStorage.setItem(
        `oidc_state_${authState}`,
        JSON.stringify({ verifier, redirectUri })
      );

      const res = await call<AuthorizationInitResult>(
        apiPrefix,
        oidc.serviceName,
        'authorize',
        {
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: 0, // Code
          scope: [0, 1, 2], // openid, profile, email
          state: authState,
          code_challenge: challenge,
          code_verifier: verifier,
          code_challenge_method: 0, // S256
        }
      );

      if (!hasError(res) && res.result.ok) {
        const target = res.result.ticket
          ? `${loginUrl}?ticket=${res.result.ticket}`
          : `${loginUrl}?state=${authState}`;
        window.location.href = target;
      } else {
        throw new Error(
          hasError(res) ? res.error.message : 'Login failed to initialize'
        );
      }
    } catch (err) {
      setState(s => ({ ...s, error: err as Error }));
    }
  }, [clientId, apiPrefix, loginUrl, redirectUri]);

  const handleCallback = useCallback(
    async (code: string, callbackState: string) => {
      setState(s => ({ ...s, loading: true }));
      try {
        const stored = sessionStorage.getItem(`oidc_state_${callbackState}`);
        if (!stored) throw new Error('Invalid state or state expired');

        const { verifier } = JSON.parse(stored);
        sessionStorage.removeItem(`oidc_state_${callbackState}`);

        const res = await call<TokenResponse>(
          apiPrefix,
          oidc.serviceName,
          'token',
          {
            grant_type: 0, // AuthorizationCode
            code,
            redirect_uri: redirectUri,
            client_id: clientId,
            code_verifier: verifier,
          }
        );

        if (!hasError(res)) {
          await fetchUser();
        } else {
          throw new Error(res.error.message);
        }
      } catch (err) {
        setState(s => ({
          ...s,
          loading: false,
          error: err as Error,
          isAuthenticated: false,
        }));
      }
    },
    [clientId, apiPrefix, redirectUri, fetchUser]
  );

  const logout = useCallback(async () => {
    try {
      await call(apiPrefix, oidc.serviceName, 'revocation', {
        token: '', // Might revoke current session/token
      });
      setState({
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      });
    } catch (err) {
      setState(s => ({ ...s, error: err as Error }));
    }
  }, [apiPrefix]);

  const contextValue = useMemo(
    () => ({
      ...state,
      login,
      logout,
      handleCallback,
      refreshUser: fetchUser,
    }),
    [state, login, logout, handleCallback, fetchUser]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
