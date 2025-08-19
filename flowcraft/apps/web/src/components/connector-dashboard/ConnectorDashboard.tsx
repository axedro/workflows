import React, { useState } from 'react';
import { Plus, Grid, List, Settings } from 'lucide-react';
import { useConnectors, useConnectorStats, useDeleteConnector, useTestConnector, Connector } from '../../hooks/useConnectors';
import { ConnectorWizard } from '../connector-wizard/ConnectorWizard';
import { ConnectorCard } from './ConnectorCard';
import { ConnectorList } from './ConnectorList';
import { ConnectorFilters } from './ConnectorFilters';
import { ConnectorStats } from './ConnectorStats';

const ConnectorDashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showWizard, setShowWizard] = useState(false);
  const [editingConnector, setEditingConnector] = useState<Connector | null>(null);
  const [filters, setFilters] = useState({
    type: '',
    isActive: true,
    search: ''
  });

  const { data: connectors = [], isLoading } = useConnectors(filters);
  const { data: stats } = useConnectorStats();
  const deleteConnector = useDeleteConnector();
  const testConnector = useTestConnector();

  const handleCreateConnector = () => {
    setShowWizard(true);
  };

  const handleWizardSuccess = (_connectorId: string) => {
    setShowWizard(false);
    setEditingConnector(null);
    // The connector will be automatically refetched by React Query
  };

  const handleWizardClose = () => {
    setShowWizard(false);
    setEditingConnector(null);
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleEditConnector = (connector: Connector) => {
    setEditingConnector(connector);
    setShowWizard(true);
  };

  const handleDeleteConnector = async (connector: Connector) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el conector "${connector.name}"?`)) {
      try {
        await deleteConnector.mutateAsync(connector.id);
        // Success notification could be added here
      } catch (error) {
        console.error('Error deleting connector:', error);
        alert('Error al eliminar el conector. Por favor, inténtalo de nuevo.');
      }
    }
  };

  const handleTestConnector = async (connector: Connector) => {
    try {
      const result = await testConnector.mutateAsync(connector.id);
      if (result.success) {
        alert(`✅ Prueba exitosa del conector "${connector.name}"`);
      } else {
        alert(`❌ Error en la prueba del conector "${connector.name}": ${result.message}`);
      }
    } catch (error) {
      console.error('Error testing connector:', error);
      alert('Error al probar el conector. Por favor, inténtalo de nuevo.');
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Gestión de Conectores
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Administra y configura tus conectores para workflows
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleCreateConnector}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Conector
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-500">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Section */}
        {stats && (
          <div className="mb-8">
            <ConnectorStats stats={stats} />
          </div>
        )}

        {/* Filters and Search */}
        <div className="mb-6">
          <ConnectorFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </div>

        {/* View Toggle and Results */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-white border border-gray-300 rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-l-md ${
                  viewMode === 'grid'
                    ? 'bg-blue-50 text-blue-600 border-r border-gray-300'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-r-md ${
                  viewMode === 'list'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <span className="text-sm text-gray-500">
              {connectors.length} conector{connectors.length !== 1 ? 'es' : ''}
            </span>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-500">Cargando conectores...</span>
          </div>
        ) : connectors.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay conectores configurados
            </h3>
            <p className="text-gray-500 mb-6">
              Comienza creando tu primer conector para poder usarlo en tus workflows.
            </p>
            <button
              onClick={handleCreateConnector}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Conector
            </button>
          </div>
        ) : (
          <div>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {connectors.map((connector) => (
                  <ConnectorCard
                    key={connector.id}
                    connector={connector}
                    onEdit={() => handleEditConnector(connector)}
                    onDelete={() => handleDeleteConnector(connector)}
                    onTest={() => handleTestConnector(connector)}
                  />
                ))}
              </div>
            ) : (
              <ConnectorList
                connectors={connectors}
                onEdit={handleEditConnector}
                onDelete={handleDeleteConnector}
                onTest={handleTestConnector}
              />
            )}
          </div>
        )}
      </div>

      {/* Wizard Modal */}
      <ConnectorWizard
        isOpen={showWizard}
        onClose={handleWizardClose}
        onSuccess={handleWizardSuccess}
        editingConnector={editingConnector}
      />
    </div>
  );
};

export default ConnectorDashboard;
