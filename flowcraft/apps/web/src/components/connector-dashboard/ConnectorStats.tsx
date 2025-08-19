import React from 'react';
import { ConnectorStats as ConnectorStatsType } from '../../hooks/useConnectors';

interface ConnectorStatsProps {
  stats: ConnectorStatsType;
}

export const ConnectorStats: React.FC<ConnectorStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Total Connectors */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-lg">🔌</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
          </div>
        </div>
      </div>

      {/* Active Connectors */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-lg">✅</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Activos</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
          </div>
        </div>
      </div>

      {/* Inactive Connectors */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-600 text-lg">⏸️</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Inactivos</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.inactive}</p>
          </div>
        </div>
      </div>

      {/* Most Common Type */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-lg">📊</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Tipo más común</p>
            <p className="text-lg font-semibold text-gray-900">
              {Object.keys(stats.byType).length > 0
                ? Object.entries(stats.byType).sort(([,a], [,b]) => b - a)[0][0]
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 