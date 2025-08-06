import React, { useState } from 'react';
import { useWorkflowStore } from '../stores/workflowStore';
import { Modal, Button, Input } from '@flowcraft/ui';
import { useTranslation } from '../hooks/i18n';

interface WorkflowExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string;
}

export const WorkflowExportModal: React.FC<WorkflowExportModalProps> = ({
  isOpen,
  onClose,
  // workflowId,
}) => {
  const { currentWorkflow } = useWorkflowStore();
  const { t } = useTranslation('workflows');
  const { t: tCommon } = useTranslation('common');
  
  const [exportName, setExportName] = useState(currentWorkflow?.name || '');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!currentWorkflow) return;

    setIsExporting(true);

    try {
      // Prepare export data
      const exportData = {
        id: currentWorkflow.id,
        name: exportName || currentWorkflow.name,
        description: currentWorkflow.description,
        version: currentWorkflow.version,
        status: currentWorkflow.status,
        nodes: currentWorkflow.definition?.nodes || [],
        edges: currentWorkflow.definition?.edges || [],
        ...(includeMetadata && {
          metadata: currentWorkflow.definition?.metadata || {
            author: t('default_author'),
            tags: [],
            difficulty: 'beginner'
          },
          tags: currentWorkflow.definition?.metadata?.tags || [],
                      difficulty: currentWorkflow.definition?.metadata?.difficulty || t('difficulty.beginner'),
          exportedAt: new Date().toISOString(),
          exportedFrom: 'FlowCraft'
        })
      };

      // Create and download file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `${exportName || currentWorkflow.name}.json`;
      link.click();
      
      URL.revokeObjectURL(link.href);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    setExportName(currentWorkflow?.name || '');
    setIncludeMetadata(true);
    onClose();
  };

  if (!currentWorkflow) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('export.title')}
      // size="md"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="exportName" className="block text-sm font-medium text-gray-700 mb-1">
            {t('export.name_label')}
          </label>
          <Input
            // id="exportName"
            type="text"
            value={exportName}
            onChange={setExportName}
            placeholder={t('export.name_placeholder')}
            disabled={isExporting}
          />
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={includeMetadata}
              onChange={(e) => setIncludeMetadata(e.target.checked)}
              disabled={isExporting}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              {t('export.include_metadata')}
            </span>
          </label>
          <p className="mt-1 text-xs text-gray-500">
            {t('export.metadata_help')}
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-gray-800 mb-2">
            {t('export.summary_title')}
          </h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div>
              <span className="font-medium">{t('export.nodes')}:</span> {currentWorkflow.definition?.nodes?.length || 0}
            </div>
            <div>
              <span className="font-medium">{t('export.edges')}:</span> {currentWorkflow.definition?.edges?.length || 0}
            </div>
            <div>
              <span className="font-medium">{t('export.version')}:</span> {currentWorkflow.version}
            </div>
            <div>
              <span className="font-medium">{t('export.status')}:</span> {currentWorkflow.status}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isExporting}
          >
            {tCommon('cancel')}
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? t('export.exporting') : t('export.export_button')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}; 