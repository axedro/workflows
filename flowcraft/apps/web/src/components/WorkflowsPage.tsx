import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflowStore } from '../stores/workflowStore';
import { Workflow } from '@flowcraft/shared-types';
import { Button, Card, Input, Modal } from '@flowcraft/ui';
import { Header } from './Header';
import { useTranslation } from '../hooks/i18n';
import { WorkflowCreationModal } from './WorkflowCreationModal';
import { WorkflowImportModal } from './WorkflowImportModal';
import { useNotificationStore } from '../stores/notificationStore';

// Using FIXED delete workflow API: 2025-08-09-09:13

const WorkflowsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('workflows');
  const {
    workflows,
    isLoading,
    error,
    pagination,
    filters,
    fetchWorkflows,
    deleteWorkflow,
    duplicateWorkflow,
    setFilters,
    setPagination,
  } = useWorkflowStore();

  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [statusFilter, setStatusFilter] = useState(filters.status || '');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(null);
  const [duplicateName, setDuplicateName] = useState('');
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [workflowToDuplicate, setWorkflowToDuplicate] = useState<Workflow | null>(null);

  useEffect(() => {
    fetchWorkflows({
      page: pagination.page,
      limit: pagination.limit,
      status: statusFilter as any,
      search: searchTerm,
    });
  }, [pagination.page, pagination.limit, statusFilter, searchTerm, fetchWorkflows]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters({ search: value });
    setPagination({ page: 1 });
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setFilters({ status: status || undefined });
    setPagination({ page: 1 });
  };

  const handleDelete = (workflow: Workflow) => {
    setWorkflowToDelete(workflow);
    setShowDeleteModal(true);
  };

  const confirmDelete = async (id: string) => {
    try {
      await deleteWorkflow(id);
      // Close modal and clear state on successful deletion
      setShowDeleteModal(false);
      setWorkflowToDelete(null);
    } catch (error: any) {
      // Check if it's a conflict error (workflow has executions)
      if (error.message && error.message.includes('Conflict')) {
        // Show confirmation dialog for force delete
        const shouldForceDelete = window.confirm(
          'This workflow has execution history. Do you want to delete it anyway? This will also delete all execution history.'
        );
        
        if (shouldForceDelete) {
          try {
            await deleteWorkflow(id, true); // Force delete
            // Close modal and clear state on successful force deletion
            setShowDeleteModal(false);
            setWorkflowToDelete(null);
          } catch (forceError: any) {
            console.error('Force delete failed:', forceError);
            // Show error notification
            useNotificationStore.getState().addNotification({
              type: 'error',
              title: 'Failed to Delete Workflow',
              message: forceError.message || 'Failed to delete workflow',
            });
          }
        }
      } else {
        console.error('Failed to delete workflow:', error);
        // Show error notification
        useNotificationStore.getState().addNotification({
          type: 'error',
          title: 'Failed to Delete Workflow',
          message: error.message || 'Failed to delete workflow',
        });
      }
    }
  };

  const handleDuplicate = (workflow: Workflow) => {
    setWorkflowToDuplicate(workflow);
    setDuplicateName(`${workflow.name} (Copy)`);
    setShowDuplicateModal(true);
  };

  const confirmDuplicate = async () => {
    if (workflowToDuplicate) {
      try {
        await duplicateWorkflow(workflowToDuplicate.id, duplicateName);
        setShowDuplicateModal(false);
        setWorkflowToDuplicate(null);
        setDuplicateName('');
      } catch (error) {
        console.error('Failed to duplicate workflow:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600 bg-green-100';
      case 'PAUSED':
        return 'text-yellow-600 bg-yellow-100';
      case 'DRAFT':
        return 'text-gray-600 bg-gray-100';
      case 'ARCHIVED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handlePageChange = (page: number) => {
    setPagination({ page });
  };

  if (isLoading && workflows.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading workflows...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Workflows</h1>
            <p className="mt-2 text-gray-600">
              Manage and organize your workflow automation processes
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowImportModal(true)}
            >
              {t('import.title')}
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
            >
              {t('create.create_button')}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search workflows..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={e => handleStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-800">Error: {error}</div>
          </div>
        )}

        {/* Workflows Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map(workflow => (
            <Card key={workflow.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {workflow.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {workflow.description || 'No description'}
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(workflow.status)}`}
                    >
                      {workflow.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      v{workflow.version}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Created: {formatDate(workflow.createdAt.toString())}
                  </div>
                  <div className="text-xs text-gray-500">
                    Updated: {formatDate(workflow.updatedAt.toString())}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/workflow/${workflow.id}`)}
                >
                  Open
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDuplicate(workflow)}
                >
                  Duplicate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(workflow)}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {workflows.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No workflows found</div>
            <Button onClick={() => setShowCreateModal(true)}>
              Create your first workflow
            </Button>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <nav className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={page === pagination.page ? "primary" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </Button>
            </nav>
          </div>
        )}
      </div>

      {/* Modals */}
      <WorkflowCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
      
      <WorkflowImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Workflow"
        // size="sm"
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to delete "{workflowToDelete?.name}"? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => confirmDelete(workflowToDelete?.id || '')}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Duplicate Modal */}
      <Modal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        title="Duplicate Workflow"
        // size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Workflow Name
            </label>
            <Input
              type="text"
              value={duplicateName}
              onChange={setDuplicateName}
              placeholder="Enter new workflow name"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowDuplicateModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDuplicate}
              disabled={!duplicateName.trim()}
            >
              Duplicate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WorkflowsPage; 