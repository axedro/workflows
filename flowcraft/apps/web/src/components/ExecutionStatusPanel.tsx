import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useExecutionStatus } from '../hooks/useExecutionStatus';
import { apiService } from '../services/api';
import { NodeDataViewer } from './execution/NodeDataViewer';
import { DataFlowViewer } from './execution/DataFlowViewer';
import { ExecutionSummary } from './execution/ExecutionSummary';
import { useNotificationStore } from '../stores/notificationStore';

interface ExecutionStatusPanelProps {
  executionId: string;
  onClose?: () => void;
}

export const ExecutionStatusPanel: React.FC<ExecutionStatusPanelProps> = ({ 
  executionId, 
  onClose 
}) => {
  const { t } = useTranslation('workflows');
  const { addNotification } = useNotificationStore();
  const [activeTab, setActiveTab] = useState<'status' | 'nodeData' | 'dataFlow' | 'summary'>('status');
  
  const { 
    data: executionStatus, 
    isLoading, 
    error, 
    refetch 
  } = useExecutionStatus(executionId);

  const [logLevel, setLogLevel] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'>('ALL');
  const [logSearch, setLogSearch] = useState<string>('');

  // Auto-refresh for running executions
  useEffect(() => {
    if (executionStatus?.status === 'RUNNING' || executionStatus?.status === 'PENDING') {
      const interval = setInterval(() => {
        refetch();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [executionStatus?.status, refetch]);

  const handleCancel = async () => {
    try {
      await apiService.cancelExecution(executionId);
      addNotification({
        type: 'success',
        title: t('execution.cancelled'),
        message: t('execution.cancelled'),
      });
      refetch();
    } catch (error) {
      addNotification({
        type: 'error',
        title: t('execution.cancelError'),
        message: t('execution.cancelError'),
      });
    }
  };

  const handleResume = async (nodeId: string) => {
    try {
      await apiService.resumeExecution(executionId, nodeId);
      addNotification({
        type: 'success',
        title: t('execution.resumed'),
        message: t('execution.resumed'),
      });
      refetch();
    } catch (error) {
      addNotification({
        type: 'error',
        title: t('execution.resumeError'),
        message: t('execution.resumeError'),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-red-600">
          {t('execution.errorLoading')}
        </div>
      </div>
    );
  }

  if (!executionStatus) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-gray-500">
          {t('execution.notFound')}
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'RUNNING':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (startedAt: string, completedAt?: string) => {
    const start = new Date(startedAt);
    const end = completedAt ? new Date(completedAt) : new Date();
    const duration = end.getTime() - start.getTime();
    return `${duration}ms`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('execution.status.title')}
            </h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(executionStatus.status)}`}>
              {executionStatus.status}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {(executionStatus.status === 'RUNNING' || executionStatus.status === 'PENDING') && (
              <button
                onClick={handleCancel}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
              >
                {t('execution.cancel')}
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {/* Execution Info */}
        <div className="mt-3 text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>
              {t('execution.started')}: {new Date(executionStatus.startedAt).toLocaleString()}
            </span>
            {executionStatus.completedAt && (
              <span>
                {t('execution.completed')}: {new Date(executionStatus.completedAt).toLocaleString()}
              </span>
            )}
            <span>
              {t('execution.duration')}: {formatDuration(executionStatus.startedAt, executionStatus.completedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { key: 'status', label: t('execution.tabs.status') },
            { key: 'nodeData', label: t('execution.tabs.nodeData') },
            { key: 'dataFlow', label: t('execution.tabs.dataFlow') },
            { key: 'summary', label: t('execution.tabs.summary') }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'status' && (
          <div className="space-y-4">
            {/* Error Display */}
            {executionStatus.errorDetails && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="text-red-500 mr-3 mt-0.5">⚠️</div>
                  <div>
                    <div className="text-red-700 font-medium">{t('execution.error')}</div>
                    <div className="text-red-600 text-sm mt-1">
                      {JSON.stringify(executionStatus.errorDetails, null, 2)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Execution Logs */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">{t('execution.logs')}</h4>

              {/* Log controls */}
              <div className="flex items-center gap-3 mb-3">
                <select
                  value={logLevel}
                  onChange={(e) => setLogLevel(e.target.value as any)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  {['ALL', 'INFO', 'WARN', 'ERROR', 'DEBUG'].map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder={t('common.search')}
                  className="border border-gray-300 rounded px-2 py-1 text-sm flex-1"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                {executionStatus.logs && executionStatus.logs.length > 0 ? (
                  <div className="space-y-2">
                    {executionStatus.logs
                      .filter(log => logLevel === 'ALL' ? true : log.level === logLevel)
                      .filter(log => logSearch ? (log.message?.toLowerCase().includes(logSearch.toLowerCase()) || log.nodeId?.toLowerCase().includes(logSearch.toLowerCase())) : true)
                      .map((log, index) => (
                        <div key={index} className="text-sm">
                          <span className="text-gray-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                            log.level === 'ERROR' ? 'bg-red-100 text-red-800' :
                            log.level === 'WARN' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {log.level}
                          </span>
                          {log.nodeId && (
                            <span className="ml-2 text-purple-700 text-xs">[{log.nodeId}]</span>
                          )}
                          <span className="ml-2 text-gray-700">{log.message}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm italic">
                    {t('execution.noLogs')}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'nodeData' && executionStatus.nodes && (
          <div className="space-y-4">
            {Object.entries(executionStatus.nodes).map(([nodeId, nodeData]) => (
              <NodeDataViewer
                key={nodeId}
                nodeId={nodeId}
                nodeData={nodeData as any}
                onResume={handleResume}
              />
            ))}
          </div>
        )}

        {activeTab === 'dataFlow' && executionStatus.dataFlow && (
          <DataFlowViewer dataFlow={executionStatus.dataFlow} />
        )}

        {activeTab === 'summary' && executionStatus.summary && (
          <ExecutionSummary summary={executionStatus.summary} />
        )}
      </div>
    </div>
  );
};
