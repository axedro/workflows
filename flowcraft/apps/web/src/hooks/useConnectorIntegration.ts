import { useState, useCallback, useMemo, useEffect } from 'react';
import { NodeType } from '@flowcraft/shared-types';
import { useConnectors, useConnector } from './useConnectors';

interface UseConnectorIntegrationOptions {
  nodeType: NodeType;
  initialConnectorId?: string;
  onConnectorDataChange?: (connectorData: Record<string, any>) => void;
}

interface UseConnectorIntegrationReturn {
  selectedConnectorId: string | undefined;
  setSelectedConnectorId: (id: string | undefined) => void;
  isWizardOpen: boolean;
  openWizard: () => void;
  closeWizard: () => void;
  editingConnectorId: string | undefined;
  openEditWizard: (connectorId: string) => void;
  compatibleConnectors: Array<{
    id: string;
    name: string;
    type: string;
    description?: string;
    isActive: boolean;
  }>;
  selectedConnector: {
    id: string;
    name: string;
    type: string;
    description?: string;
    isActive: boolean;
    configuration: Record<string, any>;
  } | undefined;
  isLoading: boolean;
  error: Error | null;
}

const isConnectorCompatible = (connectorType: string, nodeType: NodeType): boolean => {
  const compatibilityMap: Record<string, NodeType[]> = {
    'http': [NodeType.HTTP_REQUEST],
    'email': [NodeType.EMAIL],
    'webhook': [NodeType.WEBHOOK],
    'timer': [NodeType.TIMER],
    'data-transform': [NodeType.DATA_TRANSFORM],
    'slack': [NodeType.SLACK],
  };

  return compatibilityMap[connectorType]?.includes(nodeType) ?? false;
};

export const useConnectorIntegration = ({
  nodeType,
  initialConnectorId,
  onConnectorDataChange,
}: UseConnectorIntegrationOptions): UseConnectorIntegrationReturn => {
  const [selectedConnectorId, setSelectedConnectorId] = useState<string | undefined>(initialConnectorId);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingConnectorId, setEditingConnectorId] = useState<string | undefined>();

  const { data: connectors, isLoading, error } = useConnectors();
  const { data: selectedConnectorData } = useConnector(selectedConnectorId || '');

  // Filter compatible connectors
  const compatibleConnectors = useMemo(() => {
    if (!connectors) return [];
    return connectors.filter(connector => 
      isConnectorCompatible(connector.type, nodeType)
    );
  }, [connectors, nodeType]);

  // Get selected connector
  const selectedConnector = useMemo(() => {
    return compatibleConnectors.find(connector => connector.id === selectedConnectorId);
  }, [compatibleConnectors, selectedConnectorId]);

  // Wizard control functions
  const openWizard = useCallback(() => {
    setEditingConnectorId(undefined);
    setIsWizardOpen(true);
  }, []);

  const closeWizard = useCallback(() => {
    setIsWizardOpen(false);
    setEditingConnectorId(undefined);
  }, []);

  const openEditWizard = useCallback((connectorId: string) => {
    setEditingConnectorId(connectorId);
    setIsWizardOpen(true);
  }, []);

  // Effect to populate node data when connector is selected
  useEffect(() => {
    if (selectedConnectorData && onConnectorDataChange) {
      onConnectorDataChange(selectedConnectorData.configuration);
    }
  }, [selectedConnectorData, onConnectorDataChange]);

  return {
    selectedConnectorId,
    setSelectedConnectorId,
    isWizardOpen,
    openWizard,
    closeWizard,
    editingConnectorId,
    openEditWizard,
    compatibleConnectors,
    selectedConnector,
    isLoading,
    error,
  };
};