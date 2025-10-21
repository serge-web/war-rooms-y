/**
 * Custom Login Page with default credentials
 * Pre-fills gamemaster/admin123 for development convenience
 */

import { Login, LoginForm } from 'react-admin';

export const LoginPage = () => (
  <Login>
    <LoginForm defaultValues={{ username: 'gamemaster', password: 'admin123' }} />
  </Login>
);
