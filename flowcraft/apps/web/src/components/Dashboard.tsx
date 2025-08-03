import React from 'react';
import { useNavigate } from 'react-router-dom';
// import { useAuthStore } from '../stores/authStore'; // TODO: Use when user info is needed
import { Button } from '@flowcraft/ui';
import { Header } from './Header';
import { useTranslation } from '../hooks/i18n';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  // const { user } = useAuthStore(); // TODO: Use when user info is needed
  const { t } = useTranslation('dashboard');

  const handleCreateWorkflow = () => {
    // Navigate to workflow editor with a new workflow ID
    navigate('/workflow/new');
  };

  const handleViewTemplates = () => {
    // TODO: Navigate to templates page
    console.log('View templates clicked');
  };

  const handleManageConnectors = () => {
    // TODO: Navigate to connectors management page
    console.log('Manage connectors clicked');
  };

  const handleViewAnalytics = () => {
    // TODO: Navigate to analytics page
    console.log('View analytics clicked');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('title')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              {t('welcome')}
            </p>
          </div>

          {/* Dashboard Cards */}
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-semibold">W</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        {t('stats.workflows')}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        0
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-semibold">E</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        {t('stats.executions')}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        0
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-semibold">C</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        {t('stats.connectors')}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        20
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {t('quick_actions.title')}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Button
                onClick={handleCreateWorkflow}
                className="h-16 text-left justify-start hover:bg-blue-600 transition-colors"
              >
                <div>
                  <div className="font-medium">
                    {t('quick_actions.create_workflow')}
                  </div>
                  <div className="text-sm opacity-70">
                    {t('quick_actions.create_workflow_desc')}
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={handleViewTemplates}
                className="h-16 text-left justify-start hover:bg-gray-50 transition-colors"
              >
                <div>
                  <div className="font-medium">
                    {t('quick_actions.view_templates')}
                  </div>
                  <div className="text-sm opacity-70">
                    {t('quick_actions.view_templates_desc')}
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={handleManageConnectors}
                className="h-16 text-left justify-start hover:bg-gray-50 transition-colors"
              >
                <div>
                  <div className="font-medium">
                    {t('quick_actions.manage_connectors')}
                  </div>
                  <div className="text-sm opacity-70">
                    {t('quick_actions.manage_connectors_desc')}
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={handleViewAnalytics}
                className="h-16 text-left justify-start hover:bg-gray-50 transition-colors"
              >
                <div>
                  <div className="font-medium">
                    {t('quick_actions.view_analytics')}
                  </div>
                  <div className="text-sm opacity-70">
                    {t('quick_actions.view_analytics_desc')}
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
