import React from 'react';
import type { WizardData } from '../ConnectorWizard';

interface Step2SelectTypeProps {
  data: WizardData;
  onUpdate: (updates: Partial<WizardData>) => void;
  onFinish: () => void;
}

const CONNECTOR_TYPES = [
  {
    id: 'http',
    name: 'HTTP Request',
    description: 'Realizar peticiones HTTP a APIs y servicios web',
    icon: '🌐',
    category: 'Core'
  },
  {
    id: 'email',
    name: 'Email',
    description: 'Enviar emails a través de SMTP',
    icon: '📧',
    category: 'Comunicación'
  },
  {
    id: 'webhook',
    name: 'Webhook',
    description: 'Recibir eventos y notificaciones de servicios externos',
    icon: '🔗',
    category: 'Core'
  },
  {
    id: 'timer',
    name: 'Timer',
    description: 'Ejecutar acciones en intervalos programados',
    icon: '⏰',
    category: 'Core'
  },
  {
    id: 'data-transform',
    name: 'Data Transform',
    description: 'Transformar y manipular datos entre servicios',
    icon: '🔄',
    category: 'Core'
  }
];

export const Step2SelectType: React.FC<Step2SelectTypeProps> = ({ data, onUpdate }) => {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">
          Selecciona el Tipo de Conector
        </h4>
        <p className="text-sm text-gray-600 mb-6">
          Elige el tipo de conector que mejor se adapte a tus necesidades. Cada tipo tiene características y configuraciones específicas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CONNECTOR_TYPES.map((type) => (
          <div
            key={type.id}
            onClick={() => onUpdate({ type: type.id as any })}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              data.type === type.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="text-2xl">{type.icon}</div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h5 className="font-medium text-gray-900">{type.name}</h5>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {type.category}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{type.description}</p>
              </div>
              {data.type === type.id && (
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {data.type && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Tipo seleccionado
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  Has seleccionado: <strong>{CONNECTOR_TYPES.find(t => t.id === data.type)?.name}</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 