import React, { useState } from 'react';
import { apiService } from '../services/api';
import { Button } from '@flowcraft/ui';
import { useTranslation } from '../hooks/i18n';

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation('auth');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await apiService.forgotPassword(email);
      setIsSubmitted(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : t('reset_email_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
            {t('check_email')}
          </h2>
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('reset_email_sent')}
            </p>
            <Button
              onClick={onBackToLogin}
              variant="outline"
              className="w-full"
            >
              {t('back_to_login')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
          {t('forgot_password')}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('email')}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder={t('email_placeholder')}
            />
          </div>
          
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? t('sending') : t('send_reset_link')}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium"
          >
            {t('back_to_login')}
          </button>
        </div>
      </div>
    </div>
  );
}; 