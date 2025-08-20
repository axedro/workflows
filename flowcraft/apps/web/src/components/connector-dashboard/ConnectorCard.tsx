import React from 'react';
import { Edit, Trash2, Play, MoreVertical } from 'lucide-react';
import { Connector } from '../../hooks/useConnectors';

interface ConnectorCardProps {
  connector: Connector;
  onEdit: () => void;
  onDelete: () => void;
  onTest: () => void;
}

const getConnectorIcon = (type: string) => {
  switch (type) {
    case 'http':
      return '🌐';
    case 'email':
      return '📧';
    case 'webhook':
      return '🔗';
    case 'timer':
      return '⏰';
    case 'data-transform':
      return '🔄';
    default:
      return '🔌';
  }
};

const getConnectorTypeLabel = (type: string) => {
  switch (type) {
    case 'http':
      return 'HTTP Request';
    case 'email':
      return 'Email';
    case 'webhook':
      return 'Webhook';
    case 'timer':
      return 'Timer';
    case 'data-transform':
      return 'Data Transform';
    default:
      return type;
  }
};

export const ConnectorCard: React.FC<ConnectorCardProps> = ({
  connector,
  onEdit,
  onDelete,
  onTest,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="text-2xl flex-shrink-0">{getConnectorIcon(connector.type)}</div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-gray-900 truncate">{connector.name}</h3>
              <p className="text-sm text-gray-500 truncate">{getConnectorTypeLabel(connector.type)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 flex-shrink-0">
            <button
              onClick={onTest}
              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
              title="Test connector"
            >
              <Play className="w-4 h-4" />
            </button>
            <button
              onClick={onEdit}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="Edit connector"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete connector"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Description */}
        {connector.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {connector.description}
          </p>
        )}

        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                connector.isActive ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
            <span className="text-sm text-gray-500">
              {connector.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {new Date(connector.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}; 