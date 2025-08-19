import React from 'react';
import { Edit, Trash2, Play, MoreVertical } from 'lucide-react';
import { Connector } from '../../hooks/useConnectors';

interface ConnectorListProps {
  connectors: Connector[];
  onEdit: (connector: Connector) => void;
  onDelete: (connector: Connector) => void;
  onTest: (connector: Connector) => void;
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

export const ConnectorList: React.FC<ConnectorListProps> = ({
  connectors,
  onEdit,
  onDelete,
  onTest,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Conector
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tipo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Última actualización
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {connectors.map((connector) => (
            <tr key={connector.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">{getConnectorIcon(connector.type)}</div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {connector.name}
                    </div>
                    {connector.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {connector.description}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {getConnectorTypeLabel(connector.type)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${
                      connector.isActive ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                  <span className="text-sm text-gray-900">
                    {connector.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(connector.updatedAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => onTest(connector)}
                    className="text-gray-400 hover:text-green-600 transition-colors"
                    title="Test connector"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(connector)}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit connector"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(connector)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete connector"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}; 