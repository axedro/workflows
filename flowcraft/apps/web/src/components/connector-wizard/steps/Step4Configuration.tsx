import React, { useState, useEffect } from 'react';
import { Settings, Code, Database, Globe } from 'lucide-react';
import type { WizardData } from '../ConnectorWizard';
import { HttpConfiguration } from './configurations/HttpConfiguration';
import { EmailConfiguration } from './configurations/EmailConfiguration';
import { WebhookConfiguration } from './configurations/WebhookConfiguration';
import { TimerConfiguration } from './configurations/TimerConfiguration';
import { DataTransformConfiguration } from './configurations/DataTransformConfiguration';

interface Step4ConfigurationProps {
  data: WizardData;
  onUpdate: (updates: Partial<WizardData>) => void;
  onFinish: () => void;
}

export const Step4Configuration: React.FC<Step4ConfigurationProps> = ({ 
  data, 
  onUpdate 
}) => {
  const renderConfigurationComponent = () => {
    if (!data.type) {
      return (
        <div className="text-center py-8">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            Selecciona un tipo de conector en el paso anterior para configurar sus opciones.
          </p>
        </div>
      );
    }

    switch (data.type) {
      case 'http':
        return (
          <HttpConfiguration
            configuration={data.configuration}
            onUpdate={(config) => onUpdate({ configuration: config })}
          />
        );
      case 'email':
        return (
          <EmailConfiguration
            configuration={data.configuration}
            onUpdate={(config) => onUpdate({ configuration: config })}
          />
        );
      case 'webhook':
        return (
          <WebhookConfiguration
            configuration={data.configuration}
            onUpdate={(config) => onUpdate({ configuration: config })}
          />
        );
      case 'timer':
        return (
          <TimerConfiguration
            configuration={data.configuration}
            onUpdate={(config) => onUpdate({ configuration: config })}
          />
        );
      case 'data-transform':
        return (
          <DataTransformConfiguration
            configuration={data.configuration}
            onUpdate={(config) => onUpdate({ configuration: config })}
          />
        );
      default:
        return (
          <div className="text-center py-8">
            <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              Tipo de conector no soportado: {data.type}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">
          Configuración del Conector
        </h4>
        <p className="text-sm text-gray-600 mb-6">
          Configura los parámetros específicos para tu conector {data.type && `(${data.type})`}.
        </p>
      </div>

      {/* Type indicator */}
      {data.type && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Code className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Tipo de Conector: {data.type}
              </h3>
              <p className="text-sm text-blue-700">
                Configurando opciones específicas para conectores de tipo {data.type}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Content */}
      <div className="min-h-[400px]">
        {renderConfigurationComponent()}
      </div>

      {/* Configuration Summary */}
      {data.configuration && Object.keys(data.configuration).length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <h5 className="text-sm font-medium text-gray-900 mb-2">
            Resumen de Configuración
          </h5>
          <div className="text-xs text-gray-600 space-y-1">
            {Object.entries(data.configuration).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="font-medium">{key}:</span>
                <span className="truncate ml-2">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 