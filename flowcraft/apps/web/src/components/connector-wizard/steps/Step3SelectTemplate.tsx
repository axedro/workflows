import React, { useState, useEffect } from 'react';
import { Check, ExternalLink, Download } from 'lucide-react';
import type { WizardData } from '../ConnectorWizard';

interface Template {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  isPublic: boolean;
  configuration: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface Step3SelectTemplateProps {
  data: WizardData;
  onUpdate: (updates: Partial<WizardData>) => void;
  onFinish: () => void;
}

export const Step3SelectTemplate: React.FC<Step3SelectTemplateProps> = ({ 
  data, 
  onUpdate 
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Load templates based on selected type
    const loadTemplates = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        const mockTemplates: Template[] = [
          {
            id: 'http-basic',
            name: 'HTTP Request Básico',
            description: 'Configuración básica para hacer peticiones HTTP GET/POST',
            type: 'http',
            category: 'API',
            isPublic: true,
            configuration: {
              method: 'GET',
              headers: {},
              timeout: 30000,
            },
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          {
            id: 'email-smtp',
            name: 'Email SMTP',
            description: 'Configuración para envío de emails vía SMTP',
            type: 'email',
            category: 'Communication',
            isPublic: true,
            configuration: {
              host: '',
              port: 587,
              secure: false,
              from: '',
            },
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          {
            id: 'webhook-basic',
            name: 'Webhook Básico',
            description: 'Configuración para recibir webhooks',
            type: 'webhook',
            category: 'Integration',
            isPublic: true,
            configuration: {
              method: 'POST',
              path: '/webhook',
              secret: '',
            },
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ];

        // Filter templates by selected type
        const filteredTemplates = data.type 
          ? mockTemplates.filter(t => t.type === data.type)
          : mockTemplates;

        setTemplates(filteredTemplates);
      } catch (error) {
        console.error('Error loading templates:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [data.type]);

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    onUpdate({ 
      templateId: template.id,
      template: template,
      configuration: { ...template.configuration }
    });
  };

  const handleSkipTemplate = () => {
    setSelectedTemplate(null);
    onUpdate({ 
      templateId: undefined,
      template: undefined,
      configuration: {}
    });
  };

  const filteredTemplates = filter === 'all' 
    ? templates 
    : templates.filter(t => t.category === filter);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Seleccionar Plantilla
          </h4>
          <p className="text-sm text-gray-600 mb-6">
            Carga de plantillas disponibles...
          </p>
        </div>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">
          Seleccionar Plantilla
        </h4>
        <p className="text-sm text-gray-600 mb-6">
          Elige una plantilla para comenzar con una configuración predefinida, o continúa sin plantilla para configurar desde cero.
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 text-sm rounded-md ${
            filter === 'all'
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFilter('API')}
          className={`px-3 py-1 text-sm rounded-md ${
            filter === 'API'
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
          }`}
        >
          API
        </button>
        <button
          onClick={() => setFilter('Communication')}
          className={`px-3 py-1 text-sm rounded-md ${
            filter === 'Communication'
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
          }`}
        >
          Comunicación
        </button>
        <button
          onClick={() => setFilter('Integration')}
          className={`px-3 py-1 text-sm rounded-md ${
            filter === 'Integration'
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
          }`}
        >
          Integración
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            onClick={() => handleTemplateSelect(template)}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedTemplate?.id === template.id
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h5 className="font-medium text-gray-900 mb-1">
                  {template.name}
                </h5>
                <p className="text-sm text-gray-600 mb-2">
                  {template.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="px-2 py-1 bg-gray-100 rounded">
                    {template.category}
                  </span>
                  {template.isPublic && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                      Público
                    </span>
                  )}
                </div>
              </div>
              {selectedTemplate?.id === template.id && (
                <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* No templates message */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <Download className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-600">
            No hay plantillas disponibles para el tipo seleccionado.
          </p>
        </div>
      )}

      {/* Skip template option */}
      <div className="border-t pt-6">
        <button
          onClick={handleSkipTemplate}
          className={`w-full p-4 border rounded-lg text-left transition-all ${
            !selectedTemplate
              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium text-gray-900">
                Continuar sin plantilla
              </h5>
              <p className="text-sm text-gray-600">
                Configurar el conector desde cero sin usar una plantilla predefinida.
              </p>
            </div>
            {!selectedTemplate && (
              <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
            )}
          </div>
        </button>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              ¿Qué son las plantillas?
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Las plantillas son configuraciones predefinidas que te ayudan a crear conectores más rápido. 
                Incluyen configuraciones comunes y mejores prácticas para cada tipo de conector.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 