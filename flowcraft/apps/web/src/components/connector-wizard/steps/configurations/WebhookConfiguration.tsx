import React, { useState } from 'react';
import { Link, Shield, Settings, Zap } from 'lucide-react';

interface WebhookConfigurationProps {
  configuration: Record<string, any>;
  onUpdate: (updates: Record<string, any>) => void;
}

export const WebhookConfiguration: React.FC<WebhookConfigurationProps> = ({
  configuration,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'security' | 'advanced'>('basic');

  const updateField = (field: string, value: any) => {
    onUpdate({ [field]: value });
  };

  const updateHeaders = (headers: Record<string, string>) => {
    onUpdate({ headers });
  };

  const addHeader = () => {
    const currentHeaders = configuration.headers || {};
    const newKey = `header_${Object.keys(currentHeaders).length + 1}`;
    updateHeaders({ ...currentHeaders, [newKey]: '' });
  };

  const removeHeader = (key: string) => {
    const currentHeaders = configuration.headers || {};
    const newHeaders = { ...currentHeaders };
    delete newHeaders[key];
    updateHeaders(newHeaders);
  };

  const updateHeader = (key: string, value: string) => {
    const currentHeaders = configuration.headers || {};
    updateHeaders({ ...currentHeaders, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'basic', label: 'Configuración Básica', icon: Link },
            { id: 'security', label: 'Seguridad', icon: Shield },
            { id: 'advanced', label: 'Avanzado', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Basic Configuration */}
      {activeTab === 'basic' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL del Webhook *
            </label>
            <input
              type="url"
              value={configuration.webhookUrl || ''}
              onChange={(e) => updateField('webhookUrl', e.target.value)}
              placeholder="https://api.example.com/webhook"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método HTTP
              </label>
              <select
                value={configuration.method || 'POST'}
                onChange={(e) => updateField('method', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeout (segundos)
              </label>
              <input
                type="number"
                value={configuration.timeout || 30}
                onChange={(e) => updateField('timeout', parseInt(e.target.value) || 30)}
                placeholder="30"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payload por defecto
            </label>
            <textarea
              value={configuration.defaultPayload || ''}
              onChange={(e) => updateField('defaultPayload', e.target.value)}
              placeholder='{"event": "workflow_completed", "data": {}}'
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Link className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Configuración de Webhook
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    El webhook recibirá datos cuando se ejecute el workflow. Asegúrate de que la URL sea accesible desde internet.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Configuration */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Configuración de Seguridad</h4>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secret del Webhook
            </label>
            <input
              type="password"
              value={configuration.webhookSecret || ''}
              onChange={(e) => updateField('webhookSecret', e.target.value)}
              placeholder="Tu secreto para verificar la autenticidad"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Este secreto se usará para firmar las peticiones y verificar su autenticidad.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Algoritmo de firma
              </label>
              <select
                value={configuration.signatureAlgorithm || 'sha256'}
                onChange={(e) => updateField('signatureAlgorithm', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="sha1">SHA-1</option>
                <option value="sha256">SHA-256</option>
                <option value="sha512">SHA-512</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Header de firma
              </label>
              <input
                type="text"
                value={configuration.signatureHeader || 'X-Webhook-Signature'}
                onChange={(e) => updateField('signatureHeader', e.target.value)}
                placeholder="X-Webhook-Signature"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={configuration.verifySSL || true}
                onChange={(e) => updateField('verifySSL', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Verificar certificado SSL</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={configuration.retryOnFailure || true}
                onChange={(e) => updateField('retryOnFailure', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Reintentar en caso de fallo</span>
            </label>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Shield className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Seguridad del Webhook
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    Configura un secreto para asegurar que solo tu aplicación pueda enviar webhooks válidos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Configuration */}
      {activeTab === 'advanced' && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Configuración Avanzada</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número máximo de reintentos
              </label>
              <input
                type="number"
                value={configuration.maxRetries || 3}
                onChange={(e) => updateField('maxRetries', parseInt(e.target.value) || 3)}
                placeholder="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delay entre reintentos (ms)
              </label>
              <input
                type="number"
                value={configuration.retryDelay || 1000}
                onChange={(e) => updateField('retryDelay', parseInt(e.target.value) || 1000)}
                placeholder="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Headers personalizados
            </label>
            <div className="space-y-2">
              {Object.entries(configuration.headers || {}).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => {
                      const newHeaders = { ...configuration.headers };
                      delete newHeaders[key];
                      newHeaders[e.target.value] = value as string;
                      updateHeaders(newHeaders);
                    }}
                    placeholder="Header name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <span className="text-gray-500">:</span>
                  <input
                    type="text"
                    value={value as string}
                    onChange={(e) => updateHeader(key, e.target.value)}
                    placeholder="Header value"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <button
                    onClick={() => removeHeader(key)}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    <Zap className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={addHeader}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
              >
                <Zap className="w-4 h-4 mr-1" />
                Agregar Header
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transformación de respuesta
            </label>
            <textarea
              value={configuration.responseTransform || ''}
              onChange={(e) => updateField('responseTransform', e.target.value)}
              placeholder={`// Función para transformar la respuesta del webhook
function transformResponse(response) {
  return {
    success: response.status === 200,
    data: response.data
  };
}`}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Configuración Avanzada
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Solo modifica estos valores si tienes conocimientos técnicos sobre webhooks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <h5 className="text-sm font-medium text-gray-900 mb-2">
          Resumen de Configuración
        </h5>
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>URL:</span>
            <span className="truncate ml-2">
              {configuration.webhookUrl || 'No configurado'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Método:</span>
            <span>{configuration.method || 'POST'}</span>
          </div>
          <div className="flex justify-between">
            <span>Secret:</span>
            <span>{configuration.webhookSecret ? 'Configurado' : 'No configurado'}</span>
          </div>
          <div className="flex justify-between">
            <span>Headers:</span>
            <span>{Object.keys(configuration.headers || {}).length}</span>
          </div>
          <div className="flex justify-between">
            <span>Reintentos:</span>
            <span>{configuration.maxRetries || 3}</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 