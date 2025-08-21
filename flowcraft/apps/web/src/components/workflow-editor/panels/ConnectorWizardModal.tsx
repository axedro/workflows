import React, { useState, useCallback } from 'react';
import { ConnectorWizard } from '../../connector-wizard/ConnectorWizard';

interface ConnectorWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectorCreated: (connectorId: string) => void;
  editingConnectorId?: string;
}

export const ConnectorWizardModal: React.FC<ConnectorWizardModalProps> = ({
  isOpen,
  onClose,
  onConnectorCreated,
  editingConnectorId,
}) => {
  const [editingConnector, setEditingConnector] = useState<any>(null);

  // Handle connector creation/update success
  const handleConnectorSuccess = useCallback((connectorId: string) => {
    onConnectorCreated(connectorId);
    setEditingConnector(null);
  }, [onConnectorCreated]);

  // Handle modal close
  const handleClose = useCallback(() => {
    setEditingConnector(null);
    onClose();
  }, [onClose]);

  // TODO: Fetch connector data when editingConnectorId is provided
  // This would require a useConnector hook or similar to fetch individual connector data
  // For now, we'll pass the editingConnectorId directly to the wizard
  // The ConnectorWizard component should be updated to handle this case

  return (
    <ConnectorWizard
      isOpen={isOpen}
      onClose={handleClose}
      onSuccess={handleConnectorSuccess}
      editingConnector={editingConnector}
    />
  );
};