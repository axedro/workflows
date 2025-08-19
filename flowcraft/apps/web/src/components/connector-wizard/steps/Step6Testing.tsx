import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';
import { useCreateConnector, useTestConnector, useDeleteConnector } from '../../../hooks/useConnectors';
import type { WizardData } from '../ConnectorWizard';

interface Step6TestingProps {
  data: WizardData;
  onUpdate: (updates: Partial<WizardData>) => void;
  onFinish: () => void;
}

export const Step6Testing: React.FC<Step6TestingProps> = ({ data, onUpdate, onFinish: _onFinish }) => {
  const [testData, setTestData] = useState<Record<string, any>>({});
  const createConnector = useCreateConnector();
  const testConnectorMutation = useTestConnector();
  const deleteConnector = useDeleteConnector();

  const handleTest = async () => {
    try {
      console.log('handleTest - data.configuration:', data.configuration);
      console.log('handleTest - testData:', testData);
      
      // Use test data if available, otherwise use configuration
      const testConfiguration = { ...data.configuration };
      
      if (data.type === 'http' && testData.url) {
        testConfiguration.baseUrl = testData.url;
        testConfiguration.method = testData.method || data.configuration?.method || 'GET';
        if (testData.body) {
          testConfiguration.body = testData.body;
        }
      }
      
      console.log('handleTest - testConfiguration:', testConfiguration);

      // Create a temporary connector in backend for testing
      const temp = await createConnector.mutateAsync({
        name: `${data.name || 'Temp'} (test ${Date.now()})`,
        type: data.type!,
        description: 'Temporary connector for test',
        configuration: testConfiguration,
      });

      const result = await testConnectorMutation.mutateAsync(temp.id);
      
      onUpdate({
        testResult: {
          success: result.success,
          message: result.message,
          details: result.details
        }
      });
      // Cleanup temporary connector
      try { await deleteConnector.mutateAsync(temp.id); } catch {}
    } catch (error) {
      onUpdate({
        testResult: {
          success: false,
          message: error instanceof Error ? error.message : 'Error desconocido durante la prueba',
          details: null
        }
      });
    }
  };

  const getTestDataForType = () => {
    console.log('Step6Testing - data.configuration:', data.configuration);
    switch (data.type) {
      case 'http':
        const baseUrl = data.configuration?.baseUrl || '';
        const endpoint = data.configuration?.endpoint || '';
        const fullUrl = baseUrl ? (endpoint ? `${baseUrl}${endpoint}` : baseUrl) : '';
        console.log('Step6Testing - baseUrl:', baseUrl, 'endpoint:', endpoint, 'fullUrl:', fullUrl);
        return {
          method: data.configuration?.method || 'GET',
          url: fullUrl,
          headers: data.configuration?.headers || { 'Content-Type': 'application/json' },
          body: { test: true }
        };
      case 'email':
        return {
          to: 'test@example.com',
          subject: 'Test Email',
          body: 'This is a test email from FlowCraft'
        };
      case 'webhook':
        return {
          method: 'POST',
          payload: { event: 'test', data: { test: true } }
        };
      case 'timer':
        return {
          schedule: '0 * * * *',
          timezone: 'UTC'
        };
      case 'data-transform':
        return {
          input: { id: 1, name: 'Test', status: 'active' },
          expectedOutput: { id: 1, name: 'Test', status: 'active' }
        };
      default:
        return {};
    }
  };

  const renderTestConfiguration = () => {
    const defaultTestData = getTestDataForType();
    
    return (
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Datos de Prueba</h4>
        
        {data.type === 'http' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Método</label>
                <select
                  value={testData.method !== undefined ? testData.method : defaultTestData.method}
                  onChange={(e) => setTestData({ ...testData, method: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">URL</label>
                <input
                  type="text"
                  value={testData.url !== undefined ? testData.url : defaultTestData.url}
                  onChange={(e) => setTestData({ ...testData, url: e.target.value })}
                  placeholder="Ingresa la URL para probar (ej: https://api.ejemplo.com/endpoint)"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Body (JSON)</label>
              <textarea
                value={JSON.stringify(testData.body || defaultTestData.body, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setTestData({ ...testData, body: parsed });
                  } catch (error) {
                    // Ignore invalid JSON
                  }
                }}
                rows={4}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded font-mono"
              />
            </div>
          </div>
        )}

        {data.type === 'email' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Destinatario</label>
              <input
                type="email"
                value={testData.to || defaultTestData.to}
                onChange={(e) => setTestData({ ...testData, to: e.target.value })}
                placeholder="test@example.com"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Asunto</label>
              <input
                type="text"
                value={testData.subject || defaultTestData.subject}
                onChange={(e) => setTestData({ ...testData, subject: e.target.value })}
                placeholder="Test Email"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Cuerpo</label>
              <textarea
                value={testData.body || defaultTestData.body}
                onChange={(e) => setTestData({ ...testData, body: e.target.value })}
                rows={4}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
          </div>
        )}

        {data.type === 'webhook' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Payload de Prueba</label>
              <textarea
                value={JSON.stringify(testData.payload || defaultTestData.payload, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setTestData({ ...testData, payload: parsed });
                  } catch (error) {
                    // Ignore invalid JSON
                  }
                }}
                rows={6}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded font-mono"
              />
            </div>
          </div>
        )}

        {data.type === 'data-transform' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Datos de Entrada</label>
              <textarea
                value={JSON.stringify(testData.input || defaultTestData.input, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setTestData({ ...testData, input: parsed });
                  } catch (error) {
                    // Ignore invalid JSON
                  }
                }}
                rows={4}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded font-mono"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Play className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Prueba tu Conector
        </h3>
        <p className="text-gray-600">
          Verifica que tu conector esté configurado correctamente antes de guardarlo
        </p>
      </div>

      {/* Test Configuration */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        {renderTestConfiguration()}
      </div>

      {/* Test Button */}
      <div className="text-center">
        <button
          onClick={handleTest}
          disabled={testConnectorMutation.isPending}
          className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testConnectorMutation.isPending ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Probando...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Probar Conector
            </>
          )}
        </button>
      </div>

      {/* Test Results */}
      {data.testResult && (
        <div className={`border rounded-md p-4 ${
          data.testResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start">
            {data.testResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
            )}
            <div className="flex-1">
              <h4 className={`text-sm font-medium mb-1 ${
                data.testResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {data.testResult.success ? 'Prueba Exitosa' : 'Prueba Fallida'}
              </h4>
              <p className={`text-sm ${
                data.testResult.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {data.testResult.message}
              </p>
              {data.testResult.details && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-600 cursor-pointer">
                    Ver detalles
                  </summary>
                  <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto">
                    {JSON.stringify(data.testResult.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {data.testResult?.success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-green-800 mb-1">
                ¡Conector Listo!
              </h4>
              <p className="text-sm text-green-700">
                Tu conector ha sido probado exitosamente y está listo para ser usado en tus workflows.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {data.testResult && !data.testResult.success && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800 mb-1">
                Problemas Detectados
              </h4>
              <p className="text-sm text-yellow-700">
                Revisa la configuración de tu conector y vuelve a probarlo. 
                Puedes continuar sin una prueba exitosa, pero se recomienda 
                verificar la configuración antes de usar el conector.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Final Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">
          Próximos Pasos
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Tu conector estará disponible en el editor de workflows</li>
          <li>• Podrás reutilizar esta configuración en múltiples workflows</li>
          <li>• Las credenciales se almacenarán de forma segura</li>
          <li>• Podrás editar la configuración en cualquier momento</li>
        </ul>
      </div>
    </div>
  );
};
