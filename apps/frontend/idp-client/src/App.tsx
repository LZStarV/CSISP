import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { Finish } from '@/pages/Finish';
import { Login } from '@/pages/Login';
import { OAuthConsent } from '@/pages/OAuthConsent';
import { ResetPassword } from '@/pages/ResetPassword';
import { Signup } from '@/pages/Signup';
import {
  ROUTE_ROOT,
  ROUTE_LOGIN,
  ROUTE_PASSWORD_RESET,
  ROUTE_FINISH,
  ROUTE_OAUTH_CONSENT,
} from '@/routes/router';
import { useAuthStore } from '@/stores/auth';
import { useLocaleStore } from '@/stores/locale';

function App() {
  const localeStore = useLocaleStore();
  const authStore = useAuthStore();

  useEffect(() => {
    const initStores = async () => {
      await Promise.all([
        localeStore.initFromStorage(),
        authStore.initFromStorage(),
      ]);
    };
    initStores();
  }, [localeStore, authStore]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path={ROUTE_ROOT}
          element={<Navigate to={ROUTE_LOGIN} replace />}
        />
        <Route path={ROUTE_LOGIN} element={<Login />} />
        <Route path='/signup' element={<Signup />} />
        <Route path={ROUTE_PASSWORD_RESET} element={<ResetPassword />} />
        <Route path={ROUTE_FINISH} element={<Finish />} />
        <Route path={ROUTE_OAUTH_CONSENT} element={<OAuthConsent />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
