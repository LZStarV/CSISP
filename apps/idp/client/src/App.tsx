import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { Finish } from '@/pages/Finish';
import { ForgotInit } from '@/pages/ForgotInit';
import { Login } from '@/pages/Login';
import { MFASelect } from '@/pages/MFASelect';
import { ResetPassword } from '@/pages/ResetPassword';
import { SmsVerify } from '@/pages/SmsVerify';
import {
  ROUTE_ROOT,
  ROUTE_LOGIN,
  ROUTE_MFA_SELECT,
  ROUTE_MFA_SMS,
  ROUTE_PASSWORD_RESET,
  ROUTE_PASSWORD_FORGOT,
  ROUTE_FINISH,
} from '@/routes/router';
import { SessionGuard } from '@/routes/SessionGuard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path={ROUTE_ROOT}
          element={<Navigate to={ROUTE_LOGIN} replace />}
        />
        <Route
          path={ROUTE_LOGIN}
          element={
            <SessionGuard>
              <Login />
            </SessionGuard>
          }
        />
        <Route
          path={ROUTE_MFA_SELECT}
          element={
            <SessionGuard>
              <MFASelect />
            </SessionGuard>
          }
        />
        <Route
          path={ROUTE_MFA_SMS}
          element={
            <SessionGuard>
              <SmsVerify />
            </SessionGuard>
          }
        />
        <Route
          path={ROUTE_PASSWORD_RESET}
          element={
            <SessionGuard>
              <ResetPassword />
            </SessionGuard>
          }
        />
        <Route path={ROUTE_PASSWORD_FORGOT} element={<ForgotInit />} />
        <Route
          path={ROUTE_FINISH}
          element={
            <SessionGuard>
              <Finish />
            </SessionGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
