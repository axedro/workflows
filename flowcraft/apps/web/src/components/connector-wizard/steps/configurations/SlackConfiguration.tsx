import React, { useState } from 'react';
import { MessageCircle, Settings, Hash, User, Eye, EyeOff } from 'lucide-react';

interface SlackConfigurationProps {
  configuration: Record<string, any>;
  onUpdate: (updates: Record<string, any>) => void;
}

export const SlackConfiguration: React.FC<SlackConfigurationProps> = ({
  configuration,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
  const [showToken, setShowToken] = useState(false);

  const updateField = (field: string, value: any) => {
    onUpdate({ ...configuration, [field]: value });
  };

  const validateBotToken = (token: string) => {
    // Basic validation for Slack bot token format
    return token.startsWith('xoxb-') && token.length > 20;
  };

  const getTokenStatus = () => {
    const token = configuration.botToken || '';
    if (!token) return { valid: false, message: 'Token requerido' };
    if (!validateBotToken(token)) return { valid: false, message: 'Formato de token inválido' };
    return { valid: true, message: 'Token válido' };
  };

  const tokenStatus = getTokenStatus();

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'basic', label: 'Configuración Básica', icon: MessageCircle },
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
        <div className="space-y-6">
          {/* Bot Token */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bot Token *
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={configuration.botToken || ''}
                onChange={(e) => updateField('botToken', e.target.value)}
                placeholder="xoxb-your-bot-token-here"
                className={`w-full px-3 py-2 pr-10 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  tokenStatus.valid ? 'border-green-300' : 'border-red-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showToken ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            <div className={`mt-1 text-sm ${tokenStatus.valid ? 'text-green-600' : 'text-red-600'}`}>
              {tokenStatus.message}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              El bot token se puede obtener desde la página de aplicaciones de Slack
            </p>
          </div>

          {/* Default Channel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Canal por Defecto
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={configuration.defaultChannel || ''}
                onChange={(e) => updateField('defaultChannel', e.target.value)}
                placeholder="#general"
                className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Canal predeterminado para enviar mensajes (ej: #general, #alerts)
            </p>
          </div>

          {/* Bot Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Bot
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={configuration.username || ''}
                onChange={(e) => updateField('username', e.target.value)}
                placeholder="FlowCraft Bot"
                className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Nombre personalizado para el bot (opcional)
            </p>
          </div>

          {/* Bot Icon */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL del Icono
              </label>
              <input
                type="url"
                value={configuration.iconUrl || ''}
                onChange={(e) => updateField('iconUrl', e.target.value)}
                placeholder="https://example.com/icon.png"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                URL de la imagen del icono del bot
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emoji del Icono
              </label>
              <input
                type="text"
                value={configuration.iconEmoji || ''}
                onChange={(e) => updateField('iconEmoji', e.target.value)}
                placeholder=":robot_face:"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Emoji para el icono del bot (ej: :robot_face:, :wave:)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Configuration */}
      {activeTab === 'advanced' && (
        <div className="space-y-6">
          {/* Message Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Configuración de Mensajes</h4>
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={configuration.linkNames !== false}
                  onChange={(e) => updateField('linkNames', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Enlazar nombres de usuario
                </span>
              </label>
              <p className="text-xs text-gray-500 ml-6">
                Convertir automáticamente nombres de usuario en enlaces
              </p>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={configuration.unfurlLinks === true}
                  onChange={(e) => updateField('unfurlLinks', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Expandir enlaces
                </span>
              </label>
              <p className="text-xs text-gray-500 ml-6">
                Expandir automáticamente los enlaces en los mensajes
              </p>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={configuration.unfurlMedia === true}
                  onChange={(e) => updateField('unfurlMedia', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Expandir medios
                </span>
              </label>
              <p className="text-xs text-gray-500 ml-6">
                Expandir automáticamente imágenes y videos
              </p>
            </div>
          </div>

          {/* Test Configuration */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Probar Configuración</h4>
            <p className="text-xs text-gray-600 mb-3">
              Una vez configurado, podrás probar la conexión con Slack desde el panel de conectores.
            </p>
            <div className="text-xs text-gray-500">
              <p>• Verifica que el bot token sea válido</p>
              <p>• Asegúrate de que el bot tenga permisos en el canal</p>
              <p>• El bot debe estar invitado al workspace</p>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">¿Cómo obtener el Bot Token?</h4>
        <ol className="text-xs text-blue-800 space-y-1">
          <li>1. Ve a <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="underline">api.slack.com/apps</a></li>
          <li>2. Crea una nueva aplicación o selecciona una existente</li>
          <li>3. Ve a "OAuth & Permissions" en el menú lateral</li>
          <li>4. Instala la aplicación en tu workspace</li>
          <li>5. Copia el "Bot User OAuth Token" (comienza con xoxb-)</li>
          <li>6. Asegúrate de que el bot tenga los scopes necesarios: chat:write, channels:read</li>
        </ol>
      </div>
    </div>
  );
};
