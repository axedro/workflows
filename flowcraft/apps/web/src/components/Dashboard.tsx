import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@flowcraft/ui';
import { Header } from './Header';
import { useTranslation } from '../hooks/i18n';
import { useWorkflowStore } from '../stores/workflowStore';
import { WorkflowCreationModal } from './WorkflowCreationModal';
import { WorkflowImportModal } from './WorkflowImportModal';
import { apiService } from '../services/api';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');
  const { workflows, isLoading, fetchWorkflows } = useWorkflowStore();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [runningTotal, setRunningTotal] = useState(0);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  useEffect(() => {
    const loadRunning = async () => {
      let total = 0;
      for (const wf of workflows) {
        try {
          const r = await apiService.getWorkflowExecutions(wf.id, { status: 'RUNNING', limit: 50 });
          total += (r.executions || []).length;
        } catch {}
      }
      setRunningTotal(total);
    };
    if (workflows.length) loadRunning();
  }, [workflows]);

  const handleCreateWorkflow = () => {
    setShowCreateModal(true);
  };

  const handleImportWorkflow = () => {
    setShowImportModal(true);
  };

  // const handleViewTemplates = () => {
  //   // TODO: Navigate to templates page
  //   console.log('View templates clicked');
  // };

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
                        {workflows.length}
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
                        {runningTotal} running
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
                onClick={handleImportWorkflow}
                className="h-16 text-left justify-start hover:bg-gray-50 transition-colors"
              >
                <div>
                  <div className="font-medium">
                    {t('quick_actions.import_workflow')}
                  </div>
                  <div className="text-sm opacity-70">
                    {t('quick_actions.import_workflow_desc')}
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

          {/* Recent Workflows */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {t('recent_workflows.title')}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/workflows')}
              >
                {t('recent_workflows.view_all')}
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </Card>
                ))}
              </div>
            ) : workflows.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workflows.slice(0, 6).map(workflow => (
                  <div
                    key={workflow.id}
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-gray-800 rounded-lg shadow"
                    onClick={() => navigate(`/workflow/${workflow.id}`)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900 truncate">{workflow.name}</h4>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          workflow.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : workflow.status === 'DRAFT'
                            ? 'bg-gray-100 text-gray-800'
                            : workflow.status === 'PAUSED'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {workflow.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {workflow.description || t('recent_workflows.no_description')}
                    </p>
                    <div className="text-xs text-gray-500">
                      {new Date((workflow as any).updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">{t('recent_workflows.empty')}</div>
                <Button onClick={handleCreateWorkflow}>
                  {t('recent_workflows.create_first')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <WorkflowCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
      <WorkflowImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
    </div>
  );
};

export default Dashboard;