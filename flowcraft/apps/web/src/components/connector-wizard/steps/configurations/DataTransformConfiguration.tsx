import React, { useState } from 'react';
import { RefreshCw, Plus, Trash2, ArrowRight, Code } from 'lucide-react';

interface DataTransformConfigurationProps {
  configuration: Record<string, any>;
  onUpdate: (updates: Record<string, any>) => void;
}

export const DataTransformConfiguration: React.FC<DataTransformConfigurationProps> = ({
  configuration,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'mapping' | 'filtering' | 'aggregation' | 'custom'>('mapping');

  const updateField = (field: string, value: any) => {
    onUpdate({ ...configuration, [field]: value });
  };

  const updateMappings = (mappings: Array<{ from: string; to: string; type: string }>) => {
    onUpdate({ ...configuration, mappings });
  };

  const addMapping = () => {
    const currentMappings = configuration.mappings || [];
    updateMappings([...currentMappings, { from: '', to: '', type: 'copy' }]);
  };

  const removeMapping = (index: number) => {
    const currentMappings = configuration.mappings || [];
    updateMappings(currentMappings.filter((_, i) => i !== index));
  };

  const updateMapping = (index: number, field: string, value: string) => {
    const currentMappings = configuration.mappings || [];
    const updatedMappings = [...currentMappings];
    updatedMappings[index] = { ...updatedMappings[index], [field]: value };
    updateMappings(updatedMappings);
  };

  const updateFilters = (filters: Array<{ field: string; operator: string; value: string }>) => {
    onUpdate({ ...configuration, filters });
  };

  const addFilter = () => {
    const currentFilters = configuration.filters || [];
    updateFilters([...currentFilters, { field: '', operator: 'equals', value: '' }]);
  };

  const removeFilter = (index: number) => {
    const currentFilters = configuration.filters || [];
    updateFilters(currentFilters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, field: string, value: string) => {
    const currentFilters = configuration.filters || [];
    const updatedFilters = [...currentFilters];
    updatedFilters[index] = { ...updatedFilters[index], [field]: value };
    updateFilters(updatedFilters);
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'mapping', label: 'Mapeo de Campos', icon: ArrowRight },
            { id: 'filtering', label: 'Filtrado', icon: RefreshCw },
            { id: 'aggregation', label: 'Agregación', icon: Plus },
            { id: 'custom', label: 'Código Personalizado', icon: Code },
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

      {/* Field Mapping */}
      {activeTab === 'mapping' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">Mapeo de Campos</h4>
            <button
              onClick={addMapping}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar Mapeo
            </button>
          </div>

          <div className="space-y-3">
            {(configuration.mappings || []).map((mapping: any, index: number) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                <div className="flex-1">
                  <input
                    type="text"
                    value={mapping.from || ''}
                    onChange={(e) => updateMapping(index, 'from', e.target.value)}
                    placeholder="Campo origen"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <input
                    type="text"
                    value={mapping.to || ''}
                    onChange={(e) => updateMapping(index, 'to', e.target.value)}
                    placeholder="Campo destino"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <select
                  value={mapping.type || 'copy'}
                  onChange={(e) => updateMapping(index, 'type', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="copy">Copiar</option>
                  <option value="transform">Transformar</option>
                  <option value="calculate">Calcular</option>
                </select>
                <button
                  onClick={() => removeMapping(index)}
                  className="p-1 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {(!configuration.mappings || configuration.mappings.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <RefreshCw className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No hay mapeos configurados. Agrega mapeos para transformar los datos.</p>
            </div>
          )}
        </div>
      )}

      {/* Filtering */}
      {activeTab === 'filtering' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">Filtros de Datos</h4>
            <button
              onClick={addFilter}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar Filtro
            </button>
          </div>

          <div className="space-y-3">
            {(configuration.filters || []).map((filter: any, index: number) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                <div className="flex-1">
                  <input
                    type="text"
                    value={filter.field || ''}
                    onChange={(e) => updateFilter(index, 'field', e.target.value)}
                    placeholder="Campo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <select
                  value={filter.operator || 'equals'}
                  onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="equals">Igual a</option>
                  <option value="not_equals">No igual a</option>
                  <option value="contains">Contiene</option>
                  <option value="not_contains">No contiene</option>
                  <option value="greater_than">Mayor que</option>
                  <option value="less_than">Menor que</option>
                  <option value="starts_with">Empieza con</option>
                  <option value="ends_with">Termina con</option>
                </select>
                <div className="flex-1">
                  <input
                    type="text"
                    value={filter.value || ''}
                    onChange={(e) => updateFilter(index, 'value', e.target.value)}
                    placeholder="Valor"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <button
                  onClick={() => removeFilter(index)}
                  className="p-1 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {(!configuration.filters || configuration.filters.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <RefreshCw className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No hay filtros configurados. Agrega filtros para filtrar los datos.</p>
            </div>
          )}
        </div>
      )}

      {/* Aggregation */}
      {activeTab === 'aggregation' && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Agregación de Datos</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Agregación
              </label>
              <select
                value={configuration.aggregationType || 'none'}
                onChange={(e) => updateField('aggregationType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="none">Sin agregación</option>
                <option value="count">Contar</option>
                <option value="sum">Suma</option>
                <option value="average">Promedio</option>
                <option value="min">Mínimo</option>
                <option value="max">Máximo</option>
                <option value="group">Agrupar por</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campo para Agregación
              </label>
              <input
                type="text"
                value={configuration.aggregationField || ''}
                onChange={(e) => updateField('aggregationField', e.target.value)}
                placeholder="Nombre del campo"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campo de Agrupación
            </label>
            <input
              type="text"
              value={configuration.groupByField || ''}
              onChange={(e) => updateField('groupByField', e.target.value)}
              placeholder="Campo para agrupar (opcional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {/* Custom Code */}
      {activeTab === 'custom' && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Código Personalizado</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Función de Transformación (JavaScript)
            </label>
            <textarea
              value={configuration.customFunction || ''}
              onChange={(e) => updateField('customFunction', e.target.value)}
              placeholder={`// Función personalizada para transformar datos
// Parámetros: data (array de objetos)
// Retorna: array de objetos transformados

function transformData(data) {
  return data.map(item => {
    // Tu lógica de transformación aquí
    return {
      ...item,
      // Ejemplo: agregar un campo calculado
      fullName: item.firstName + ' ' + item.lastName
    };
  });
}`}
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  Código Personalizado
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    El código personalizado se ejecuta en un entorno seguro. Asegúrate de que tu código sea válido y no contenga operaciones peligrosas.
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
            <span>Mapeos:</span>
            <span>{(configuration.mappings || []).length}</span>
          </div>
          <div className="flex justify-between">
            <span>Filtros:</span>
            <span>{(configuration.filters || []).length}</span>
          </div>
          <div className="flex justify-between">
            <span>Agregación:</span>
            <span>{configuration.aggregationType || 'Ninguna'}</span>
          </div>
          <div className="flex justify-between">
            <span>Código personalizado:</span>
            <span>{configuration.customFunction ? 'Configurado' : 'No configurado'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 