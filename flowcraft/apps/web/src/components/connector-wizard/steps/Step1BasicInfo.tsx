import React from 'react';
import type { WizardData } from '../ConnectorWizard';

interface Step1BasicInfoProps {
  data: WizardData;
  onUpdate: (updates: Partial<WizardData>) => void;
  onFinish: () => void;
}

export const Step1BasicInfo: React.FC<Step1BasicInfoProps> = ({ data, onUpdate }) => {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">
          Información Básica del Conector
        </h4>
        <p className="text-sm text-gray-600 mb-6">
          Define la información básica de tu conector. Esta información te ayudará a identificar y organizar tus conectores.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Conector *
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ej: API de Clientes, Webhook de Notificaciones, etc."
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Usa un nombre descriptivo que identifique claramente el propósito del conector.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            value={data.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe el propósito de este conector, qué hace y cómo se usa..."
            rows={4}
          />
          <p className="mt-1 text-xs text-gray-500">
            Una descripción clara ayudará a otros usuarios a entender el propósito del conector.
          </p>
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
              Consejo
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Usa nombres descriptivos y específicos. Por ejemplo, en lugar de "API", usa "API de CRM de Salesforce" 
                o "Webhook de Notificaciones de Slack".
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 