import React, { useState, useEffect, useMemo } from 'react';
import { EditorNode, NodeType, DataFlow, DataType, DataField } from '@flowcraft/shared-types';
import { Eye, EyeOff, RefreshCw, Download, Copy, Search, Filter, Settings, Play, Pause } from 'lucide-react';

interface DataPreviewSystemProps {
  nodes: EditorNode[];
  edges: any[];
  selectedNodeId?: string;
  onDataPreviewChange?: (nodeId: string, data: any) => void;
  className?: string;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

interface DataPreviewState {
  nodeId: string;
  data: any;
  timestamp: number;
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
}

interface DataPreviewConfig {
  autoRefresh: boolean;
  refreshInterval: number;
  maxDataSize: number;
  showTimestamps: boolean;
  showDataTypes: boolean;
  filterEmpty: boolean;
  searchTerm: string;
}

// Data Type Renderer Component
const DataTypeRenderer: React.FC<{
  value: any;
  type?: DataType;
  maxDepth?: number;
  currentDepth?: number;
}> = ({ value, type, maxDepth = 3, currentDepth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(currentDepth < 2);
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const getValueType = (val: any): string => {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (Array.isArray(val)) return 'array';
    if (typeof val === 'object') return 'object';
    return typeof val;
  };

  const getTypeColor = (val: any): string => {
    const valueType = getValueType(val);
    switch (valueType) {
      case 'string': return 'text-green-600';
      case 'number': return 'text-blue-600';
      case 'boolean': return 'text-purple-600';
      case 'object': return 'text-orange-600';
      case 'array': return 'text-indigo-600';
      case 'null': return 'text-gray-500';
      case 'undefined': return 'text-gray-400';
      default: return 'text-gray-700';
    }
  };

  const formatValue = (val: any): string => {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeof val === 'string') return `"${val}"`;
    if (typeof val === 'number') return val.toString();
    if (typeof val === 'boolean') return val.toString();
    if (Array.isArray(val)) return `Array(${val.length})`;
    if (typeof val === 'object') return 'Object';
    return String(val);
  };

  const renderValue = () => {
    if (value === null || value === undefined) {
      return (
        <span className="text-gray-500 italic">
          {value === null ? 'null' : 'undefined'}
        </span>
      );
    }

    if (typeof value === 'string') {
      return (
        <div className="flex items-center space-x-2">
          <span className="text-green-600 font-mono">"{value}"</span>
          <button
            onClick={() => copyToClipboard(value)}
            className="text-gray-400 hover:text-gray-600"
            title="Copy value"
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>
      );
    }

    if (typeof value === 'number') {
      return <span className="text-blue-600 font-mono">{value}</span>;
    }

    if (typeof value === 'boolean') {
      return (
        <span className={`font-mono ${value ? 'text-green-600' : 'text-red-600'}`}>
          {value.toString()}
        </span>
      );
    }

    if (Array.isArray(value)) {
      if (currentDepth >= maxDepth) {
        return (
          <div className="flex items-center space-x-2">
            <span className="text-indigo-600 font-mono">Array({value.length})</span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          </div>
        );
      }

      return (
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-indigo-600 font-mono">Array({value.length})</span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          </div>
          {isExpanded && (
            <div className="ml-4 space-y-1">
              {value.map((item: any, index: number) => (
                <div key={index} className="flex items-start space-x-2">
                  <span className="text-gray-500 text-xs w-6">[{index}]:</span>
                  <DataTypeRenderer
                    value={item}
                    maxDepth={maxDepth}
                    currentDepth={currentDepth + 1}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (typeof value === 'object') {
      if (currentDepth >= maxDepth) {
        return (
          <div className="flex items-center space-x-2">
            <span className="text-orange-600 font-mono">Object</span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          </div>
        );
      }

      const keys = Object.keys(value);
      return (
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-orange-600 font-mono">Object({keys.length})</span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          </div>
          {isExpanded && (
            <div className="ml-4 space-y-1">
              {keys.map((key) => (
                <div key={key} className="flex items-start space-x-2">
                  <span className="text-gray-600 text-xs font-medium w-20 truncate">
                    {key}:
                  </span>
                  <DataTypeRenderer
                    value={value[key]}
                    maxDepth={maxDepth}
                    currentDepth={currentDepth + 1}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return <span className="font-mono">{String(value)}</span>;
  };

  return (
    <div className="text-sm">
      {renderValue()}
    </div>
  );
};

// Node Data Preview Component
const NodeDataPreview: React.FC<{
  node: EditorNode;
  data: any;
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
  timestamp: number;
  config: DataPreviewConfig;
  onRefresh?: () => void;
}> = ({ node, data, status, error, timestamp, config, onRefresh }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const filteredData = useMemo(() => {
    if (!data || typeof data !== 'object') return data;

    if (config.searchTerm) {
      const searchLower = config.searchTerm.toLowerCase();
      const filtered: any = {};
      
      Object.entries(data).forEach(([key, value]) => {
        if (key.toLowerCase().includes(searchLower) || 
            String(value).toLowerCase().includes(searchLower)) {
          filtered[key] = value;
        }
      });
      
      return filtered;
    }

    if (config.filterEmpty) {
      const filtered: any = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          filtered[key] = value;
        }
      });
      return filtered;
    }

    return data;
  }, [data, config.searchTerm, config.filterEmpty]);

  const getNodeIcon = (nodeType: NodeType): string => {
    const iconMap: Record<string, string> = {
      [NodeType.START]: '🚀',
      [NodeType.END]: '🏁',
      [NodeType.HTTP_REQUEST]: '🌐',
      [NodeType.EMAIL]: '📧',
      [NodeType.CONDITION]: '❓',
      [NodeType.DATA_TRANSFORM]: '🔄',
      [NodeType.WEBHOOK]: '🔗',
      [NodeType.TIMER]: '⏰',
      [NodeType.SLACK]: '💬',
    };
    return iconMap[nodeType] || '🔧';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'loading': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'loading': return '⏳';
      default: return '⏸️';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      {/* Node Header */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getNodeIcon(node.type)}</span>
          <div>
            <h4 className="text-sm font-medium text-gray-900">{node.data?.label || node.id}</h4>
            <p className="text-xs text-gray-600">{node.type}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-1 text-xs ${getStatusColor(status)}`}>
            <span>{getStatusIcon(status)}</span>
            <span className="capitalize">{status}</span>
          </div>
          
          {config.showTimestamps && (
            <span className="text-xs text-gray-500">
              {new Date(timestamp).toLocaleTimeString()}
            </span>
          )}
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600"
          >
            {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-blue-500 hover:text-blue-700"
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Node Content */}
      {isExpanded && (
        <div className="p-3">
          {status === 'loading' && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Loading data...</span>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center space-x-2">
                <span className="text-red-600">❌</span>
                <span className="text-sm text-red-800">{error || 'Unknown error'}</span>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-3">
              {filteredData && typeof filteredData === 'object' && Object.keys(filteredData).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(filteredData).map(([key, value]) => (
                    <div key={key} className="flex items-start space-x-3 p-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-medium text-gray-700">{key}</span>
                          {config.showDataTypes && (
                            <span className="text-xs text-gray-500">
                              ({typeof value})
                            </span>
                          )}
                        </div>
                        <DataTypeRenderer value={value} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No data available</p>
                  {config.searchTerm && (
                    <p className="text-xs mt-1">Try adjusting your search terms</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Data Preview Configuration Panel
const DataPreviewConfig: React.FC<{
  config: DataPreviewConfig;
  onConfigChange: (config: DataPreviewConfig) => void;
}> = ({ config, onConfigChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Settings className="w-4 h-4 text-gray-600" />
          <h4 className="text-sm font-medium text-gray-900">Preview Settings</h4>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-gray-600"
        >
          {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-3 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.autoRefresh}
                  onChange={(e) => onConfigChange({ ...config, autoRefresh: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Auto Refresh</span>
              </label>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.showTimestamps}
                  onChange={(e) => onConfigChange({ ...config, showTimestamps: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Show Timestamps</span>
              </label>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.showDataTypes}
                  onChange={(e) => onConfigChange({ ...config, showDataTypes: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Show Data Types</span>
              </label>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.filterEmpty}
                  onChange={(e) => onConfigChange({ ...config, filterEmpty: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Filter Empty Values</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Refresh Interval (ms)
              </label>
              <input
                type="number"
                value={config.refreshInterval}
                onChange={(e) => onConfigChange({ ...config, refreshInterval: parseInt(e.target.value) || 5000 })}
                min="1000"
                max="60000"
                step="1000"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Max Data Size (KB)
              </label>
              <input
                type="number"
                value={config.maxDataSize}
                onChange={(e) => onConfigChange({ ...config, maxDataSize: parseInt(e.target.value) || 100 })}
                min="10"
                max="1000"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Data Preview System Component
export const DataPreviewSystem: React.FC<DataPreviewSystemProps> = ({
  nodes,
  edges,
  selectedNodeId,
  onDataPreviewChange,
  className = '',
  isVisible = true,
  onToggleVisibility
}) => {
  const [previewStates, setPreviewStates] = useState<Record<string, DataPreviewState>>({});
  const [config, setConfig] = useState<DataPreviewConfig>({
    autoRefresh: true,
    refreshInterval: 5000,
    maxDataSize: 100,
    showTimestamps: true,
    showDataTypes: true,
    filterEmpty: false,
    searchTerm: ''
  });

  // Generate sample data for nodes
  const generateSampleData = (node: EditorNode): any => {
    const sampleData: any = {
      id: node.id,
      type: node.type,
      label: node.data?.label || node.id,
      timestamp: Date.now(),
      status: 'success'
    };

    // Add node-specific sample data
    switch (node.type) {
      case NodeType.HTTP_REQUEST:
        sampleData.response = {
          status: 200,
          data: { message: 'Sample response data' },
          headers: { 'content-type': 'application/json' }
        };
        break;
      case NodeType.EMAIL:
        sampleData.email = {
          to: 'user@example.com',
          subject: 'Sample Email',
          body: 'This is a sample email content'
        };
        break;
      case NodeType.CONDITION:
        sampleData.condition = {
          result: true,
          evaluatedConditions: [
            { field: 'status', operator: 'equals', value: 'active', result: true }
          ]
        };
        break;
      case NodeType.DATA_TRANSFORM:
        sampleData.transformed = {
          original: { name: 'John', age: 30 },
          result: { fullName: 'John Doe', isAdult: true }
        };
        break;
      default:
        sampleData.data = { message: 'Sample data for ' + node.type };
    }

    return sampleData;
  };

  // Initialize preview states for nodes
  useEffect(() => {
    const newStates: Record<string, DataPreviewState> = {};
    nodes.forEach(node => {
      if (!previewStates[node.id]) {
        newStates[node.id] = {
          nodeId: node.id,
          data: generateSampleData(node),
          timestamp: Date.now(),
          status: 'success'
        };
      }
    });
    
    if (Object.keys(newStates).length > 0) {
      setPreviewStates(prev => ({ ...prev, ...newStates }));
    }
  }, [nodes]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!config.autoRefresh) return;

    const interval = setInterval(() => {
      setPreviewStates(prev => {
        const updated: Record<string, DataPreviewState> = {};
        Object.keys(prev).forEach(nodeId => {
          const node = nodes.find(n => n.id === nodeId);
          if (node) {
            updated[nodeId] = {
              ...prev[nodeId],
              data: generateSampleData(node),
              timestamp: Date.now()
            };
          }
        });
        return updated;
      });
    }, config.refreshInterval);

    return () => clearInterval(interval);
  }, [config.autoRefresh, config.refreshInterval, nodes]);

  // Filter nodes based on search term
  const filteredNodes = useMemo(() => {
    if (!config.searchTerm) return nodes;
    
    return nodes.filter(node => {
      const nodeLabel = node.data?.label || node.id;
      const nodeType = node.type;
      const searchLower = config.searchTerm.toLowerCase();
      
      return nodeLabel.toLowerCase().includes(searchLower) ||
             nodeType.toLowerCase().includes(searchLower);
    });
  }, [nodes, config.searchTerm]);

  const handleRefreshNode = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setPreviewStates(prev => ({
        ...prev,
        [nodeId]: {
          ...prev[nodeId],
          status: 'loading',
          timestamp: Date.now()
        }
      }));

      // Simulate loading delay
      setTimeout(() => {
        setPreviewStates(prev => ({
          ...prev,
          [nodeId]: {
            ...prev[nodeId],
            data: generateSampleData(node),
            status: 'success',
            timestamp: Date.now()
          }
        }));
      }, 1000);
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Data Preview</h3>
            <p className="text-sm text-gray-600">Real-time data visualization for all nodes</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleVisibility}
            className="text-gray-400 hover:text-gray-600"
            title="Toggle visibility"
          >
            <EyeOff className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={config.searchTerm}
              onChange={(e) => setConfig({ ...config, searchTerm: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setConfig({ ...config, filterEmpty: !config.filterEmpty })}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              config.filterEmpty
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4 inline mr-1" />
            Filter Empty
          </button>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="p-4 border-b border-gray-200">
        <DataPreviewConfig config={config} onConfigChange={setConfig} />
      </div>

      {/* Data Preview Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        <div className="space-y-4">
          {filteredNodes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Eye className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No nodes found</p>
              {config.searchTerm && (
                <p className="text-xs mt-1">Try adjusting your search terms</p>
              )}
            </div>
          ) : (
            filteredNodes.map(node => {
              const previewState = previewStates[node.id];
              if (!previewState) return null;

              return (
                <NodeDataPreview
                  key={node.id}
                  node={node}
                  data={previewState.data}
                  status={previewState.status}
                  error={previewState.error}
                  timestamp={previewState.timestamp}
                  config={config}
                  onRefresh={() => handleRefreshNode(node.id)}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>
            Showing {filteredNodes.length} of {nodes.length} nodes
          </span>
          <span>
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DataPreviewSystem;
