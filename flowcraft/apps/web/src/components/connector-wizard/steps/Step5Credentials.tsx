import React, { useState } from 'react';
import { Key, Eye, EyeOff, Shield, Lock, User, Globe } from 'lucide-react';
import type { WizardData } from '../ConnectorWizard';

interface Step5CredentialsProps {
  data: WizardData;
  onUpdate: (updates: Partial<WizardData>) => void;
  onFinish: () => void;
}

export const Step5Credentials: React.FC<Step5CredentialsProps> = ({ 
  data, 
  onUpdate 
}) => {
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('basic');

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleCredentialUpdate = (key: string, value: string) => {
    onUpdate({
      credentials: {
        ...data.credentials,
        [key]: value
      }
    });
  };

  const getCredentialFields = () => {
    if (!data.type) return [];

    switch (data.type) {
      case 'http':
        return [
          { key: 'apiKey', label: 'API Key', type: 'password', icon: Key, required: false },
          { key: 'username', label: 'Usuario', type: 'text', icon: User, required: false },
          { key: 'password', label: 'Contraseña', type: 'password', icon: Lock, required: false },
          { key: 'bearerToken', label: 'Bearer Token', type: 'password', icon: Shield, required: false },
        ];
      case 'email':
        return [
          { key: 'username', label: 'Usuario SMTP', type: 'text', icon: User, required: true },
          { key: 'password', label: 'Contraseña SMTP', type: 'password', icon: Lock, required: true },
          { key: 'apiKey', label: 'API Key (opcional)', type: 'password', icon: Key, required: false },
        ];
      case 'webhook':
        return [
          { key: 'secret', label: 'Webhook Secret', type: 'password', icon: Shield, required: false },
          { key: 'apiKey', label: 'API Key', type: 'password', icon: Key, required: false },
        ];
      case 'timer':
        return [
          { key: 'timezone', label: 'Zona Horaria', type: 'text', icon: Globe, required: false },
        ];
      case 'data-transform':
        return [
          { key: 'apiKey', label: 'API Key (opcional)', type: 'password', icon: Key, required: false },
        ];
      default:
        return [];
    }
  };

  const credentialFields = getCredentialFields();

  const tabs = [
    { id: 'basic', name: 'Básico', icon: Key },
    { id: 'advanced', name: 'Avanzado', icon: Shield },
    { id: 'security', name: 'Seguridad', icon: Lock },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">
          Credenciales del Conector
        </h4>
        <p className="text-sm text-gray-600 mb-6">
          Configura las credenciales necesarias para que tu conector se conecte con el servicio externo.
        </p>
      </div>

      {/* Type indicator */}
      {data.type && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Key className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Tipo de Conector: {data.type}
              </h3>
              <p className="text-sm text-blue-700">
                Configurando credenciales específicas para conectores de tipo {data.type}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'basic' && (
          <div className="space-y-6">
            {!data.type ? (
              <div className="text-center py-8">
                <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Selecciona un tipo de conector en el paso anterior para configurar sus credenciales.
                </p>
              </div>
            ) : credentialFields.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Este tipo de conector no requiere credenciales específicas.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {credentialFields.map((field) => {
                  const Icon = field.icon;
                  const isPassword = field.type === 'password';
                  const showPassword = showPasswords[field.key] || false;
                  
                  return (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Icon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type={isPassword && !showPassword ? 'password' : 'text'}
                          value={data.credentials[field.key] || ''}
                          onChange={(e) => handleCredentialUpdate(field.key, e.target.value)}
                          className={`w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            field.required && !data.credentials[field.key] ? 'border-red-300' : ''
                          }`}
                          placeholder={`Ingresa ${field.label.toLowerCase()}`}
                          required={field.required}
                        />
                        {isPassword && (
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(field.key)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            ) : (
                              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                        )}
                      </div>
                      {field.required && !data.credentials[field.key] && (
                        <p className="mt-1 text-sm text-red-600">
                          Este campo es requerido.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Credenciales Avanzadas
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Las opciones avanzadas de credenciales están en desarrollo. Por ahora, usa las credenciales básicas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Shield className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Seguridad de Credenciales
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Todas las credenciales se almacenan de forma encriptada</li>
                      <li>Las contraseñas nunca se muestran en texto plano</li>
                      <li>Acceso auditado y registrado</li>
                      <li>Cumplimiento con estándares de seguridad</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Mejores Prácticas
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Usa credenciales específicas para cada conector</li>
                      <li>Rota las credenciales regularmente</li>
                      <li>No compartas credenciales entre diferentes servicios</li>
                      <li>Usa tokens de acceso con permisos mínimos necesarios</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Credentials Summary */}
      {data.credentials && Object.keys(data.credentials).length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <h5 className="text-sm font-medium text-gray-900 mb-2">
            Credenciales Configuradas
          </h5>
          <div className="text-xs text-gray-600 space-y-1">
            {Object.entries(data.credentials).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="font-medium">{key}:</span>
                <span className="truncate ml-2">
                  {typeof value === 'string' && value.length > 0 ? '••••••••' : 'No configurado'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 