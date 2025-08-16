import React, { useState } from 'react';

interface NodeData {
  id: string;
  nodeId: string;
  status: string;
  startedAt?: string;
  completedAt?: string;
  inputData?: Record<string, any>;
  outputData?: Record<string, any>;
  errorDetails?: string;
  performance?: Record<string, any>;
  metadata?: Record<string, any>;
}

interface NodeDataViewerProps {
  node: NodeData;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export const NodeDataViewer: React.FC<NodeDataViewerProps> = ({
  node,
  isExpanded = false,
  onToggle
}) => {
  const [activeTab, setActiveTab] = useState<'input' | 'output' | 'performance' | 'metadata'>('input');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'RUNNING':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDuration = (startedAt?: string, completedAt?: string) => {
    if (!startedAt) return 'N/A';
    const start = new Date(startedAt);
    const end = completedAt ? new Date(completedAt) : new Date();
    const duration = end.getTime() - start.getTime();
    return `${duration}ms`;
  };

  const renderJsonData = (data: Record<string, any> | undefined, title: string) => {
    if (!data || Object.keys(data).length === 0) {
      return (
        <div className="text-gray-500 text-sm italic">
          No {title.toLowerCase()} data available
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">{title}</h4>
          <button
            onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))}
            className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
          >
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Copy JSON
          </button>
        </div>
        <pre className="bg-gray-50 rounded-lg p-3 text-xs overflow-x-auto max-h-64 overflow-y-auto">
          <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
      </div>
    );
  };

  const renderPerformanceData = (performance?: Record<string, any>) => {
    if (!performance) {
      return (
        <div className="text-gray-500 text-sm italic">
          No performance data available
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Performance Metrics</h4>
        <div className="grid grid-cols-2 gap-4">
          {performance.duration && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600">Duration</div>
              <div className="text-sm font-medium">{performance.duration}ms</div>
            </div>
          )}
          {performance.startedAt && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600">Started At</div>
              <div className="text-sm font-medium">
                {new Date(performance.startedAt).toLocaleTimeString()}
              </div>
            </div>
          )}
          {performance.completedAt && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600">Completed At</div>
              <div className="text-sm font-medium">
                {new Date(performance.completedAt).toLocaleTimeString()}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMetadata = (metadata?: Record<string, any>) => {
    if (!metadata || Object.keys(metadata).length === 0) {
      return (
        <div className="text-gray-500 text-sm italic">
          No metadata available
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Metadata</h4>
        <div className="bg-gray-50 rounded-lg p-3">
          <dl className="space-y-2">
            {Object.entries(metadata).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <dt className="text-xs text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</dt>
                <dd className="text-sm font-medium">{String(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div 
        className="bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {onToggle && (
              <div className="text-gray-500">
                {isExpanded ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            )}
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="font-medium text-sm">{node.metadata?.nodeName || node.nodeId}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(node.status)}`}>
                {node.status}
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {formatDuration(node.startedAt, node.completedAt)}
          </div>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Error Display */}
          {node.errorDetails && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start">
                <div className="text-red-500 mr-2 mt-0.5">⚠️</div>
                <div>
                  <div className="text-red-700 font-medium text-sm">Error</div>
                  <div className="text-red-600 text-sm mt-1">{node.errorDetails}</div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {['input', 'output', 'performance', 'metadata'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-[200px]">
            {activeTab === 'input' && renderJsonData(node.inputData, 'Input Data')}
            {activeTab === 'output' && renderJsonData(node.outputData, 'Output Data')}
            {activeTab === 'performance' && renderPerformanceData(node.performance)}
            {activeTab === 'metadata' && renderMetadata(node.metadata)}
          </div>
        </div>
      )}
    </div>
  );
};
