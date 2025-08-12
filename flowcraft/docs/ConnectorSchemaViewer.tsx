/**
 * CONNECTOR SCHEMA VIEWER COMPONENT
 * 
 * Este código fue extraído del DataConfigPanel para simplificar la UI.
 * Se puede reutilizar para crear un wizard de configuración de conectores
 * o una herramienta de documentación independiente.
 * 
 * CASOS DE USO FUTUROS:
 * - Wizard de configuración de nuevos conectores
 * - Herramienta de debugging de schemas
 * - Documentación interactiva del sistema
 * - Panel de desarrollo/testing
 */

import React from 'react';
import { NodeType, getNodeSchema } from '@flowcraft/shared-types';
import ConnectorValidationService from '../services/connectorValidation.service';

interface ConnectorSchemaViewerProps {
  onExport?: (schema: any) => void;
  onImport?: (schema: any) => void;
  showValidationTests?: boolean;
}

const ConnectorSchemaViewer: React.FC<ConnectorSchemaViewerProps> = ({ 
  onExport, 
  onImport, 
  showValidationTests = true 
}) => {
  const connectorTypes = [
    { type: NodeType.HTTP_REQUEST, name: 'HTTP Request', icon: '🌐' },
    { type: NodeType.EMAIL, name: 'Email', icon: '📧' },
    { type: NodeType.SLACK, name: 'Slack', icon: '💬' },
    { type: NodeType.TIMER, name: 'Timer', icon: '⏰' },
    { type: NodeType.WEBHOOK, name: 'Webhook', icon: '🔗' },
    { type: NodeType.DATA_TRANSFORM, name: 'Data Transform', icon: '🔄' },
  ];

  const generateSampleValue = (field: any): any => {
    switch (field.type) {
      case 'STRING':
        return field.example || `Sample ${field.name}`;
      case 'NUMBER':
        return field.example || 42;
      case 'BOOLEAN':
        return field.example || true;
      case 'ARRAY':
        return field.example || ['item1', 'item2'];
      case 'OBJECT':
        return field.example || { key: 'value' };
      case 'DATE':
        return field.example || new Date().toISOString();
      case 'EMAIL':
        return field.example || 'user@example.com';
      case 'URL':
        return field.example || 'https://example.com';
      default:
        return field.example || null;
    }
  };

  const handleExportSchema = (connectorType: NodeType) => {
    const config = {
      connectorType: connectorType,
      fields: {},
      schema: getNodeSchema(connectorType).input
    };
    const exported = ConnectorValidationService.exportConnectorConfig(config);
    
    if (onExport) {
      onExport(exported);
    } else {
      navigator.clipboard.writeText(exported);
      alert('Schema exported to clipboard!');
    }
  };

  const handleImportSchema = () => {
    const input = prompt('Paste configuration JSON:');
    if (input) {
      try {
        const imported = ConnectorValidationService.importConnectorConfig(input);
        
        if (onImport) {
          onImport(imported);
        } else {
          alert('Configuration imported successfully!');
        }
      } catch (error) {
        alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Connector Schemas</h3>
          <p className="text-sm text-gray-600 mt-1">
            Reference documentation for available connector types and their data schemas.
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleExportSchema(NodeType.HTTP_REQUEST)}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Export Sample
          </button>
          <button
            onClick={handleImportSchema}
            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
          >
            Import Config
          </button>
        </div>
      </div>

      {/* Connector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {connectorTypes.map((connector) => {
          const schema = getNodeSchema(connector.type);
          const inputFields = Object.values(schema.input);
          const outputFields = Object.values(schema.output);

          return (
            <div key={connector.type} className="border border-gray-200 rounded-lg p-4">
              {/* Connector Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">{connector.icon}</span>
                  <h4 className="font-medium text-gray-700">{connector.name}</h4>
                </div>
                <button
                  onClick={() => handleExportSchema(connector.type)}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                >
                  Export
                </button>
              </div>

              <div className="space-y-3">
                {/* Input Fields */}
                <div>
                  <h5 className="text-sm font-medium text-gray-600 mb-2">
                    📥 Input Fields ({inputFields.length})
                  </h5>
                  <div className="space-y-1">
                    {inputFields.map((field: any) => (
                      <div key={field.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-700" title={field.description}>
                          {field.name}
                        </span>
                        <div className="flex items-center space-x-1">
                          <span className={`px-1 py-0.5 rounded text-xs ${
                            field.required 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {field.required ? 'Required' : 'Optional'}
                          </span>
                          <span className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                            {field.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Output Fields */}
                <div>
                  <h5 className="text-sm font-medium text-gray-600 mb-2">
                    📤 Output Fields ({outputFields.length})
                  </h5>
                  <div className="space-y-1">
                    {outputFields.map((field: any) => (
                      <div key={field.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-700" title={field.description}>
                          {field.name}
                        </span>
                        <span className="px-1 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                          {field.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Validation Test */}
                {showValidationTests && (
                  <div className="pt-2 border-t border-gray-100">
                    <button
                      onClick={() => {
                        // Create sample data for validation test
                        const sampleData: Record<string, any> = {};
                        inputFields.forEach((field: any) => {
                          sampleData[field.id] = field.example || generateSampleValue(field);
                        });

                        const validationResult = ConnectorValidationService.validateConnector({
                          connectorType: connector.type,
                          fields: sampleData,
                          schema: schema.input
                        });

                        if (validationResult.isValid) {
                          alert(`✅ ${connector.name} validation passed!`);
                        } else {
                          alert(`❌ ${connector.name} validation failed:\n${validationResult.errors.join('\n')}`);
                        }
                      }}
                      className="w-full px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
                    >
                      Test Validation
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Usage Examples */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">💡 Usage Ideas</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Use as standalone documentation page for connector schemas</li>
          <li>• Integrate into connector configuration wizards</li>
          <li>• Add to developer tools section for debugging</li>
          <li>• Extend with real-time schema validation</li>
          <li>• Add filtering and search capabilities</li>
        </ul>
      </div>
    </div>
  );
};

export default ConnectorSchemaViewer;

/**
 * INTEGRATION EXAMPLES:
 * 
 * 1. As a standalone page:
 *    <Route path="/docs/connectors" component={ConnectorSchemaViewer} />
 * 
 * 2. As part of connector wizard:
 *    <ConnectorSchemaViewer 
 *      onExport={handleSchemaExport} 
 *      onImport={handleSchemaImport}
 *      showValidationTests={false} 
 *    />
 * 
 * 3. As developer tool:
 *    <Modal title="Schema Reference">
 *      <ConnectorSchemaViewer />
 *    </Modal>
 */