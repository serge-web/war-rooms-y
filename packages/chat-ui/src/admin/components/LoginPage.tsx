/**
 * Custom Login Page with default credentials
 * Pre-fills gamemaster/admin123 for development convenience
 */

import { Login, LoginForm } from 'react-admin';
import { useEffect } from 'react';

export const LoginPage = () => {
  useEffect(() => {
    // Pre-fill form fields for development
    const usernameField = document.querySelector('input[name="username"]') as HTMLInputElement;
    const passwordField = document.querySelector('input[name="password"]') as HTMLInputElement;

    if (usernameField && !usernameField.value) {
      usernameField.value = 'gamemaster';
      // Dispatch input event so React-Admin recognizes the change
      usernameField.dispatchEvent(new Event('input', { bubbles: true }));
    }

    if (passwordField && !passwordField.value) {
      passwordField.value = 'admin123';
      passwordField.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, []);

  return (
    <Login>
      <LoginForm />
    </Login>
  );
};
