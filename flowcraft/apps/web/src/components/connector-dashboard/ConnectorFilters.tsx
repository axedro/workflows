import React from 'react';
import { Search, Filter } from 'lucide-react';
import { ConnectorFilters } from '../../hooks/useConnectors';

interface ConnectorFiltersProps {
  filters: ConnectorFilters;
  onFiltersChange: (filters: Partial<ConnectorFilters>) => void;
}

export const ConnectorFilters: React.FC<ConnectorFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar conectores..."
              value={filters.search || ''}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Type Filter */}
        <div className="sm:w-48">
          <select
            value={filters.type || ''}
            onChange={(e) => onFiltersChange({ type: e.target.value || undefined })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los tipos</option>
            <option value="http">HTTP Request</option>
            <option value="email">Email</option>
            <option value="webhook">Webhook</option>
            <option value="timer">Timer</option>
            <option value="data-transform">Data Transform</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="sm:w-32">
          <select
            value={filters.isActive === undefined ? '' : filters.isActive.toString()}
            onChange={(e) => {
              const value = e.target.value;
              onFiltersChange({
                isActive: value === '' ? undefined : value === 'true',
              });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>

        {/* Clear Filters */}
        {(filters.search || filters.type || filters.isActive !== undefined) && (
          <button
            onClick={() => onFiltersChange({ search: '', type: undefined, isActive: undefined })}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}; 