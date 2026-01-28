import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { Finish } from '@/pages/Finish';
import { Login } from '@/pages/Login';
import { MFASelect } from '@/pages/MFASelect';
import { ResetPassword } from '@/pages/ResetPassword';
import { SmsVerify } from '@/pages/SmsVerify';
import { SessionGuard } from '@/routes/SessionGuard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Navigate to='/login' replace />} />
        <Route
          path='/login'
          element={
            <SessionGuard>
              <Login />
            </SessionGuard>
          }
        />
        <Route
          path='/mfa/select'
          element={
            <SessionGuard>
              <MFASelect />
            </SessionGuard>
          }
        />
        <Route
          path='/mfa/sms'
          element={
            <SessionGuard>
              <SmsVerify />
            </SessionGuard>
          }
        />
        <Route
          path='/password/reset'
          element={
            <SessionGuard>
              <ResetPassword />
            </SessionGuard>
          }
        />
        <Route
          path='/finish'
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
