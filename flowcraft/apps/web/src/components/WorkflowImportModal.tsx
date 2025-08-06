import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflowStore } from '../stores/workflowStore';
import { Modal, Button } from '@flowcraft/ui';
import { useTranslation } from '../hooks/i18n';

interface WorkflowImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkflowImportModal: React.FC<WorkflowImportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { createWorkflow } = useWorkflowStore();
  const { t } = useTranslation('workflows');
  const { t: tCommon } = useTranslation('common');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importData, setImportData] = useState<{
    name: string;
    description: string;
    definition: any;
  } | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setImportData(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const workflowData = JSON.parse(content);

        // Validate workflow structure
        if (!workflowData.name || !workflowData.nodes || !workflowData.edges) {
          throw new Error(t('import.errors.invalid_format'));
        }

        setImportData({
          name: workflowData.name,
          description: workflowData.description || '',
          definition: {
            nodes: workflowData.nodes,
            edges: workflowData.edges,
            metadata: workflowData.metadata || {
              author: t('default_author'),
              tags: workflowData.tags || [],
                              difficulty: workflowData.difficulty || t('difficulty.beginner')
            }
          }
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : t('import.errors.parse_failed'));
      }
    };

    reader.onerror = () => {
      setError(t('import.errors.read_failed'));
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importData) return;

    setIsLoading(true);
    setError(null);

    try {
      const workflow = await createWorkflow({
        name: importData.name,
        description: importData.description,
        definition: importData.definition,
      });

      // Navigate to the imported workflow
      navigate(`/workflow/${workflow.id}`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('import.errors.create_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setImportData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('import.title')}
      // size="lg"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('import.file_label')}
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500">
            {t('import.file_help')}
          </p>
        </div>

        {importData && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              {t('import.preview_title')}
            </h4>
            <div className="space-y-2 text-sm text-blue-700">
              <div>
                <span className="font-medium">{t('import.name')}:</span> {importData.name}
              </div>
              {importData.description && (
                <div>
                  <span className="font-medium">{t('import.description')}:</span> {importData.description}
                </div>
              )}
              <div>
                <span className="font-medium">{t('import.nodes')}:</span> {importData.definition.nodes.length}
              </div>
              <div>
                <span className="font-medium">{t('import.edges')}:</span> {importData.definition.edges.length}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            {tCommon('cancel')}
          </Button>
          <Button
            onClick={handleImport}
            disabled={isLoading || !importData}
          >
            {isLoading ? t('import.importing') : t('import.import_button')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}; 