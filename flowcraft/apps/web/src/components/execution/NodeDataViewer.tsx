import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface NodeDataViewerProps {
  nodeId: string;
  nodeData: {
    inputData?: any;
    outputData?: any;
    performance?: any;
    metadata?: any;
    status?: string;
  };
  onResume?: (nodeId: string) => void;
}

export const NodeDataViewer: React.FC<NodeDataViewerProps> = ({ 
  nodeId, 
  nodeData, 
  onResume 
}) => {
  const { t } = useTranslation('workflows');
  const [activeTab, setActiveTab] = useState<'input' | 'output' | 'performance' | 'metadata'>('input');
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatJson = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const renderTruncationNotice = (data: any) => {
    if (data && typeof data === 'object' && (data.__truncated || data.__preview)) {
      return (
        <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-2 py-1 mb-2 inline-block">
          {t('execution.truncated') || 'Data truncated'}
          {data.__bytes ? ` (${data.__bytes} bytes)` : ''}
        </div>
      );
    }
    return null;
  };

  const isFailed = nodeData.status === 'FAILED';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('execution.nodeData.title')} - {nodeId}
        </h3>
        {isFailed && onResume && (
          <button
            onClick={() => onResume(nodeId)}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            {t('execution.resume')}
          </button>
        )}
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          nodeData.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
          nodeData.status === 'FAILED' ? 'bg-red-100 text-red-800' :
          nodeData.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {nodeData.status || 'UNKNOWN'}
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'input', label: t('execution.nodeData.input') },
            { key: 'output', label: t('execution.nodeData.output') },
            { key: 'performance', label: t('execution.nodeData.performance') },
            { key: 'metadata', label: t('execution.nodeData.metadata') }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
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
      <div className="space-y-4">
        {activeTab === 'input' && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-700">{t('execution.nodeData.inputData')}</h4>
              <button
                onClick={() => copyToClipboard(formatJson(nodeData.inputData), 'input')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {copied === 'input' ? t('common.copied') : t('common.copy')}
              </button>
            </div>
            <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto max-h-64">
              {renderTruncationNotice(nodeData.inputData)}
              {formatJson(nodeData.inputData)}
            </pre>
          </div>
        )}

        {activeTab === 'output' && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-700">{t('execution.nodeData.outputData')}</h4>
              <button
                onClick={() => copyToClipboard(formatJson(nodeData.outputData), 'output')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {copied === 'output' ? t('common.copied') : t('common.copy')}
              </button>
            </div>
            <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto max-h-64">
              {renderTruncationNotice(nodeData.outputData)}
              {formatJson(nodeData.outputData)}
            </pre>
          </div>
        )}

        {activeTab === 'performance' && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-700">{t('execution.nodeData.performance')}</h4>
              <button
                onClick={() => copyToClipboard(formatJson(nodeData.performance), 'performance')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {copied === 'performance' ? t('common.copied') : t('common.copy')}
              </button>
            </div>
            <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto max-h-64">
              {formatJson(nodeData.performance)}
            </pre>
          </div>
        )}

        {activeTab === 'metadata' && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-700">{t('execution.nodeData.metadata')}</h4>
              <button
                onClick={() => copyToClipboard(formatJson(nodeData.metadata), 'metadata')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {copied === 'metadata' ? t('common.copied') : t('common.copy')}
              </button>
            </div>
            <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto max-h-64">
              {formatJson(nodeData.metadata)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
