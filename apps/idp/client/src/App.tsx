import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { Finish } from '@/pages/Finish';
import { Login } from '@/pages/Login';
import { MFASelect } from '@/pages/MFASelect';
import { ResetPassword } from '@/pages/ResetPassword';
import { SmsVerify } from '@/pages/SmsVerify';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Navigate to='/login' replace />} />
        <Route path='/login' element={<Login />} />
        <Route path='/mfa/select' element={<MFASelect />} />
        <Route path='/mfa/sms' element={<SmsVerify />} />
        <Route path='/password/reset' element={<ResetPassword />} />
        <Route path='/finish' element={<Finish />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
