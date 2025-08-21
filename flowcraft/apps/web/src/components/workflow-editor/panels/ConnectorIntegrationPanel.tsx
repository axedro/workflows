import React, { useMemo, useState } from 'react';
import { Plus, Settings, ExternalLink, TestTube, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { NodeType } from '@flowcraft/shared-types';
import { useConnectors, useTestConnector } from '../../../hooks/useConnectors';

interface ConnectorIntegrationPanelProps {
  nodeType: NodeType;
  selectedConnectorId?: string;
  onConnectorSelect: (connectorId: string) => void;
  onCreateConnector: () => void;
  onEditConnector?: (connectorId: string) => void;
  onConnectorTest?: (connectorId: string, result: any) => void;
}

const isConnectorCompatible = (connectorType: string, nodeType: NodeType): boolean => {
  const compatibilityMap: Record<string, NodeType[]> = {
    'http': [NodeType.HTTP_REQUEST, NodeType.WEBHOOK],
    'email': [NodeType.EMAIL],
    'webhook': [NodeType.WEBHOOK, NodeType.HTTP_REQUEST],
    'timer': [NodeType.TIMER],
    'data-transform': [NodeType.DATA_TRANSFORM],
    'slack': [NodeType.SLACK],
  };

  return compatibilityMap[connectorType]?.includes(nodeType) ?? false;
};

const getConnectorTypeIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    'http': '🌐',
    'email': '📧',
    'webhook': '🔗',
    'timer': '⏰',
    'data-transform': '🔄',
    'slack': '💬',
  };
  return iconMap[type] || '🔧';
};

const getConnectorTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    'http': 'from-blue-400 to-blue-600',
    'email': 'from-green-400 to-green-600',
    'webhook': 'from-purple-400 to-purple-600',
    'timer': 'from-orange-400 to-orange-600',
    'data-transform': 'from-indigo-400 to-indigo-600',
    'slack': 'from-pink-400 to-pink-600',
  };
  return colorMap[type] || 'from-gray-400 to-gray-600';
};

// Connector Preview Component
const ConnectorPreview: React.FC<{
  connector: any;
  onTest: (connectorId: string) => void;
  testResult?: any;
  isTesting?: boolean;
}> = ({ connector, onTest, testResult, isTesting }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getConnectorTypeColor(connector.type)} flex items-center justify-center text-white text-lg`}>
            {getConnectorTypeIcon(connector.type)}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">{connector.name}</h4>
            <p className="text-xs text-gray-600">{connector.type.toUpperCase()} Connector</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onTest(connector.id)}
            disabled={isTesting}
            className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              isTesting
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {isTesting ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <TestTube className="w-3 h-3 mr-1" />
            )}
            {isTesting ? 'Testing...' : 'Test'}
          </button>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-gray-400 hover:text-gray-600"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Test Result */}
      {testResult && (
        <div className={`mb-3 p-2 rounded-md text-xs ${
          testResult.success 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center">
            {testResult.success ? (
              <CheckCircle className="w-3 h-3 mr-1" />
            ) : (
              <XCircle className="w-3 h-3 mr-1" />
            )}
            <span className="font-medium">
              {testResult.success ? 'Test Successful' : 'Test Failed'}
            </span>
          </div>
          {testResult.message && (
            <p className="mt-1">{testResult.message}</p>
          )}
        </div>
      )}

      {/* Connector Details */}
      {showDetails && (
        <div className="mt-3 p-3 bg-white rounded-md border border-gray-200">
          <h5 className="text-xs font-medium text-gray-700 mb-2">Configuration Preview</h5>
          <div className="space-y-1 text-xs text-gray-600">
            {connector.configuration && Object.entries(connector.configuration).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="font-mono">{key}:</span>
                <span className="truncate ml-2">
                  {typeof value === 'string' && value.length > 20 
                    ? `${value.substring(0, 20)}...` 
                    : String(value)
                  }
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex justify-between text-xs">
              <span>Status: <span className={`font-medium ${connector.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {connector.isActive ? 'Active' : 'Inactive'}
              </span></span>
              <span>Version: {connector.version || '1.0.0'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Auto-configuration indicator */}
      <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
        <div className="flex items-center text-xs text-green-700">
          <CheckCircle className="w-3 h-3 mr-1" />
          <span>Auto-configuration available</span>
        </div>
        <p className="text-xs text-green-600 mt-1">
          This connector will automatically configure the node with its settings
        </p>
      </div>
    </div>
  );
};

// Enhanced Connector Card
const ConnectorCard: React.FC<{
  connector: any;
  isSelected: boolean;
  onSelect: (connectorId: string) => void;
  onEdit: (connectorId: string) => void;
  onTest: (connectorId: string) => void;
  testResult?: any;
  isTesting?: boolean;
}> = ({ connector, isSelected, onSelect, onEdit, onTest, testResult, isTesting }) => {
  return (
    <div className={`relative p-3 rounded-lg border transition-all duration-200 ${
      isSelected
        ? 'border-blue-300 bg-blue-50 shadow-md'
        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getConnectorTypeColor(connector.type)} flex items-center justify-center text-white text-sm`}>
            {getConnectorTypeIcon(connector.type)}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {connector.name}
            </h4>
            <p className="text-xs text-gray-600 truncate">
              {connector.description}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          {/* Status indicator */}
          <div className={`w-2 h-2 rounded-full ${
            connector.isActive ? 'bg-green-400' : 'bg-gray-400'
          }`} />
          
          {/* Test button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTest(connector.id);
            }}
            disabled={isTesting}
            className={`p-1 rounded transition-colors ${
              isTesting
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title="Test connector"
          >
            {isTesting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <TestTube className="w-3 h-3" />
            )}
          </button>
          
          {/* Edit button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(connector.id);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
            title="Edit connector"
          >
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Test result indicator */}
      {testResult && (
        <div className={`mt-2 p-1 rounded text-xs flex items-center ${
          testResult.success 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {testResult.success ? (
            <CheckCircle className="w-3 h-3 mr-1" />
          ) : (
            <XCircle className="w-3 h-3 mr-1" />
          )}
          {testResult.success ? 'Test passed' : 'Test failed'}
        </div>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
            <CheckCircle className="w-3 h-3 text-white" />
          </div>
        </div>
      )}
    </div>
  );
};

export const ConnectorIntegrationPanel: React.FC<ConnectorIntegrationPanelProps> = ({
  nodeType,
  selectedConnectorId,
  onConnectorSelect,
  onCreateConnector,
  onEditConnector,
  onConnectorTest,
}) => {
  const { data: connectors, isLoading, error } = useConnectors();
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [testingConnectors, setTestingConnectors] = useState<Set<string>>(new Set());

  const testConnectorMutation = useTestConnector();

  const compatibleConnectors = useMemo(() => {
    if (!connectors) return [];
    return connectors.filter(connector => 
      isConnectorCompatible(connector.type, nodeType)
    );
  }, [connectors, nodeType]);

  const selectedConnector = useMemo(() => {
    return compatibleConnectors.find(connector => connector.id === selectedConnectorId);
  }, [compatibleConnectors, selectedConnectorId]);

  const handleTestConnector = async (connectorId: string) => {
    setTestingConnectors(prev => new Set(prev).add(connectorId));
    
    try {
      const result = await testConnectorMutation.mutateAsync(connectorId);
      setTestResults(prev => ({ ...prev, [connectorId]: result }));
      
      if (onConnectorTest) {
        onConnectorTest(connectorId, result);
      }
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [connectorId]: { 
          success: false, 
          message: error instanceof Error ? error.message : 'Test failed' 
        } 
      }));
    } finally {
      setTestingConnectors(prev => {
        const newSet = new Set(prev);
        newSet.delete(connectorId);
        return newSet;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900">Seleccionar Conector</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900">Seleccionar Conector</h3>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">Error cargando conectores: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Seleccionar Conector</h3>
        <button
          onClick={onCreateConnector}
          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="w-3 h-3 mr-1" />
          Nuevo
        </button>
      </div>

      {/* Selected Connector Preview */}
      {selectedConnector && (
        <ConnectorPreview
          connector={selectedConnector}
          onTest={handleTestConnector}
          testResult={testResults[selectedConnector.id]}
          isTesting={testingConnectors.has(selectedConnector.id)}
        />
      )}

      {compatibleConnectors.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-md border-2 border-dashed border-gray-300">
          <div className="text-4xl mb-2">🔌</div>
          <p className="text-sm text-gray-600 mb-4">
            No hay conectores compatibles con este tipo de nodo
          </p>
          <button
            onClick={onCreateConnector}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Primer Conector
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
            Conectores Disponibles ({compatibleConnectors.length})
          </h4>
          
          {/* Available Connectors Grid */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {compatibleConnectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => onConnectorSelect(connector.id)}
                className="w-full text-left"
              >
                <ConnectorCard
                  connector={connector}
                  isSelected={connector.id === selectedConnectorId}
                  onSelect={onConnectorSelect}
                  onEdit={onEditConnector || (() => {})}
                  onTest={handleTestConnector}
                  testResult={testResults[connector.id]}
                  isTesting={testingConnectors.has(connector.id)}
                />
              </button>
            ))}
          </div>

          {/* Enhanced Info */}
          <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
            <div className="flex items-start space-x-2">
              <div className="text-blue-600 mt-0.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">💡 Conectores Avanzados</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Auto-configuración automática del nodo</li>
                  <li>• Testing integrado para validar conectividad</li>
                  <li>• Reutilización entre múltiples workflows</li>
                  <li>• Gestión centralizada de credenciales</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};