import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';

type AuthMode = 'login' | 'register' | 'forgot-password';

const Auth: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>('login');

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'register') {
      setMode('register');
    } else if (modeParam === 'forgot-password') {
      setMode('forgot-password');
    } else {
      setMode('login');
    }
  }, [searchParams]);

  const renderForm = () => {
    switch (mode) {
      case 'login':
        return (
          <LoginForm 
            onSwitchToRegister={() => setMode('register')}
            onForgotPassword={() => setMode('forgot-password')}
          />
        );
      case 'register':
        return (
          <RegisterForm onSwitchToLogin={() => setMode('login')} />
        );
      case 'forgot-password':
        return (
          <ForgotPasswordForm onBackToLogin={() => setMode('login')} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            FlowCraft
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Workflow Automation Platform
          </p>
        </div>
        
        {renderForm()}
      </div>
    </div>
  );
};

export default Auth; 