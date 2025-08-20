import React, { useState } from 'react';
import { Globe, Plus, Trash2 } from 'lucide-react';
import type { ConnectorTemplate } from '../../../../stores/connectorStore';

interface HttpConfigurationProps {
  configuration: Record<string, any>;
  onUpdate: (updates: Record<string, any>) => void;
  template?: ConnectorTemplate | null;
}

export const HttpConfiguration: React.FC<HttpConfigurationProps> = ({
  configuration,
  onUpdate,
  template: _template
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'headers' | 'auth' | 'advanced'>('basic');

  const updateField = (field: string, value: any) => {
    console.log('HttpConfiguration - updateField:', field, value);
    onUpdate({ ...configuration, [field]: value });
  };

  const updateHeaders = (headers: Record<string, string>) => {
    onUpdate({ ...configuration, headers });
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
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-8 whitespace-nowrap">
          {[
            { id: 'basic', label: 'Básico', icon: Globe },
            { id: 'headers', label: 'Headers', icon: Plus },
            { id: 'auth', label: 'Autenticación', icon: Globe },
            { id: 'advanced', label: 'Avanzado', icon: Globe }
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
              URL Base *
            </label>
            <input
              type="url"
              value={configuration.baseUrl || ''}
              onChange={(e) => updateField('baseUrl', e.target.value)}
              placeholder="https://api.example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método HTTP
              </label>
              <select
                value={configuration.method || 'GET'}
                onChange={(e) => updateField('method', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                Timeout (ms)
              </label>
              <input
                type="number"
                value={configuration.timeout || 30000}
                onChange={(e) => updateField('timeout', parseInt(e.target.value))}
                min="1000"
                max="300000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Endpoint Path
            </label>
            <input
              type="text"
              value={configuration.endpoint || ''}
              onChange={(e) => updateField('endpoint', e.target.value)}
              placeholder="/api/v1/users"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Headers Configuration */}
      {activeTab === 'headers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">Headers HTTP</h4>
            <button
              onClick={addHeader}
              className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar Header
            </button>
          </div>

          <div className="space-y-3">
            {Object.entries(configuration.headers || {}).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-3">
                <input
                  type="text"
                  value={key}
                  onChange={(e) => {
                    const currentHeaders = configuration.headers || {};
                    const newHeaders = { ...currentHeaders };
                    delete newHeaders[key];
                    newHeaders[e.target.value] = value as string;
                    updateHeaders(newHeaders);
                  }}
                  placeholder="Content-Type"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  value={value as string}
                  onChange={(e) => updateHeader(key, e.target.value)}
                  placeholder="application/json"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => removeHeader(key)}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {Object.keys(configuration.headers || {}).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No hay headers configurados</p>
              <p className="text-sm">Haz clic en "Agregar Header" para comenzar</p>
            </div>
          )}
        </div>
      )}

      {/* Authentication Configuration */}
      {activeTab === 'auth' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Autenticación
            </label>
            <select
              value={configuration.authType || 'none'}
              onChange={(e) => updateField('authType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="none">Sin autenticación</option>
              <option value="api_key">API Key</option>
              <option value="bearer">Bearer Token</option>
              <option value="basic">Basic Auth</option>
              <option value="oauth2">OAuth 2.0</option>
            </select>
          </div>

          {configuration.authType === 'api_key' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Header
                </label>
                <input
                  type="text"
                  value={configuration.apiKeyHeader || 'X-API-Key'}
                  onChange={(e) => updateField('apiKeyHeader', e.target.value)}
                  placeholder="X-API-Key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor del API Key
                </label>
                <input
                  type="password"
                  value={configuration.apiKeyValue || ''}
                  onChange={(e) => updateField('apiKeyValue', e.target.value)}
                  placeholder="Tu API key aquí"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {configuration.authType === 'bearer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bearer Token
              </label>
              <input
                type="password"
                value={configuration.bearerToken || ''}
                onChange={(e) => updateField('bearerToken', e.target.value)}
                placeholder="Tu bearer token aquí"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {configuration.authType === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usuario
                </label>
                <input
                  type="text"
                  value={configuration.basicUsername || ''}
                  onChange={(e) => updateField('basicUsername', e.target.value)}
                  placeholder="Usuario"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={configuration.basicPassword || ''}
                  onChange={(e) => updateField('basicPassword', e.target.value)}
                  placeholder="Contraseña"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Advanced Configuration */}
      {activeTab === 'advanced' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Retry Attempts
            </label>
            <input
              type="number"
              value={configuration.retryAttempts || 3}
              onChange={(e) => updateField('retryAttempts', parseInt(e.target.value))}
              min="0"
              max="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Retry Delay (ms)
            </label>
            <input
              type="number"
              value={configuration.retryDelay || 1000}
              onChange={(e) => updateField('retryDelay', parseInt(e.target.value))}
              min="100"
              max="10000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Follow Redirects
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={configuration.followRedirects !== false}
                onChange={(e) => updateField('followRedirects', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Seguir redirecciones automáticamente</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Validate SSL
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={configuration.validateSSL !== false}
                onChange={(e) => updateField('validateSSL', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Validar certificados SSL</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
