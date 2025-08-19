import React, { useState } from 'react';
import { Mail, Server, FileText, Settings } from 'lucide-react';

interface EmailConfigurationProps {
  configuration: Record<string, any>;
  onUpdate: (updates: Record<string, any>) => void;
}

export const EmailConfiguration: React.FC<EmailConfigurationProps> = ({
  configuration,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'smtp' | 'templates' | 'advanced'>('smtp');

  const updateField = (field: string, value: any) => {
    onUpdate({ ...configuration, [field]: value });
  };

  const updateTemplates = (templates: Array<{ name: string; subject: string; body: string }>) => {
    onUpdate({ ...configuration, templates });
  };

  const addTemplate = () => {
    const currentTemplates = configuration.templates || [];
    updateTemplates([...currentTemplates, { name: '', subject: '', body: '' }]);
  };

  const removeTemplate = (index: number) => {
    const currentTemplates = configuration.templates || [];
    updateTemplates(currentTemplates.filter((_, i) => i !== index));
  };

  const updateTemplate = (index: number, field: string, value: string) => {
    const currentTemplates = configuration.templates || [];
    const updatedTemplates = [...currentTemplates];
    updatedTemplates[index] = { ...updatedTemplates[index], [field]: value };
    updateTemplates(updatedTemplates);
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'smtp', label: 'Configuración SMTP', icon: Server },
            { id: 'templates', label: 'Plantillas', icon: FileText },
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

      {/* SMTP Configuration */}
      {activeTab === 'smtp' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Servidor SMTP *
              </label>
              <input
                type="text"
                value={configuration.smtpHost || ''}
                onChange={(e) => updateField('smtpHost', e.target.value)}
                placeholder="smtp.gmail.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Puerto *
              </label>
              <input
                type="number"
                value={configuration.smtpPort || ''}
                onChange={(e) => updateField('smtpPort', parseInt(e.target.value) || 587)}
                placeholder="587"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario SMTP *
              </label>
              <input
                type="email"
                value={configuration.smtpUser || ''}
                onChange={(e) => updateField('smtpUser', e.target.value)}
                placeholder="tu-email@gmail.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña SMTP *
              </label>
              <input
                type="password"
                value={configuration.smtpPassword || ''}
                onChange={(e) => updateField('smtpPassword', e.target.value)}
                placeholder="Tu contraseña de aplicación"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remitente por defecto *
              </label>
              <input
                type="email"
                value={configuration.defaultFrom || ''}
                onChange={(e) => updateField('defaultFrom', e.target.value)}
                placeholder="noreply@tuempresa.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del remitente
              </label>
              <input
                type="text"
                value={configuration.defaultFromName || ''}
                onChange={(e) => updateField('defaultFromName', e.target.value)}
                placeholder="Tu Empresa"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={configuration.secure || false}
                onChange={(e) => updateField('secure', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Usar SSL/TLS</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={configuration.requireTLS || false}
                onChange={(e) => updateField('requireTLS', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Requerir TLS</span>
            </label>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Mail className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Configuración SMTP
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Para Gmail, usa una contraseña de aplicación en lugar de tu contraseña normal. 
                    Para otros proveedores, consulta su documentación sobre configuración SMTP.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Templates */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">Plantillas de Email</h4>
            <button
              onClick={addTemplate}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
            >
              <FileText className="w-4 h-4 mr-1" />
              Agregar Plantilla
            </button>
          </div>

          <div className="space-y-4">
            {(configuration.templates || []).map((template: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-md p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la plantilla
                    </label>
                    <input
                      type="text"
                      value={template.name || ''}
                      onChange={(e) => updateTemplate(index, 'name', e.target.value)}
                      placeholder="Notificación de bienvenida"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Asunto
                    </label>
                    <input
                      type="text"
                      value={template.subject || ''}
                      onChange={(e) => updateTemplate(index, 'subject', e.target.value)}
                      placeholder="Bienvenido a nuestra plataforma"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cuerpo del email
                  </label>
                  <textarea
                    value={template.body || ''}
                    onChange={(e) => updateTemplate(index, 'body', e.target.value)}
                    placeholder="Hola {{name}}, bienvenido a nuestra plataforma..."
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => removeTemplate(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Eliminar plantilla
                  </button>
                </div>
              </div>
            ))}
          </div>

          {(!configuration.templates || configuration.templates.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No hay plantillas configuradas. Agrega plantillas para emails predefinidos.</p>
            </div>
          )}
        </div>
      )}

      {/* Advanced Configuration */}
      {activeTab === 'advanced' && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Configuración Avanzada</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeout de conexión (ms)
              </label>
              <input
                type="number"
                value={configuration.timeout || 30000}
                onChange={(e) => updateField('timeout', parseInt(e.target.value) || 30000)}
                placeholder="30000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Límite de reintentos
              </label>
              <input
                type="number"
                value={configuration.maxRetries || 3}
                onChange={(e) => updateField('maxRetries', parseInt(e.target.value) || 3)}
                placeholder="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Headers personalizados
            </label>
            <textarea
              value={configuration.customHeaders || ''}
              onChange={(e) => updateField('customHeaders', e.target.value)}
              placeholder='{"X-Custom-Header": "value"}'
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    Solo modifica estos valores si tienes conocimientos técnicos sobre configuración SMTP.
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
            <span>Servidor SMTP:</span>
            <span>{configuration.smtpHost || 'No configurado'}</span>
          </div>
          <div className="flex justify-between">
            <span>Puerto:</span>
            <span>{configuration.smtpPort || 'No configurado'}</span>
          </div>
          <div className="flex justify-between">
            <span>Remitente:</span>
            <span>{configuration.defaultFrom || 'No configurado'}</span>
          </div>
          <div className="flex justify-between">
            <span>Plantillas:</span>
            <span>{(configuration.templates || []).length}</span>
          </div>
          <div className="flex justify-between">
            <span>SSL/TLS:</span>
            <span>{configuration.secure ? 'Habilitado' : 'Deshabilitado'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 