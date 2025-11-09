import type { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';

import './App.css';

import { AuthProvider } from './contexts/AuthContext';
import { AppRoutes } from './routes';

const App = (): ReactElement => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
