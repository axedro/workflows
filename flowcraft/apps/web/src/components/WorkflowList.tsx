import React, { useEffect, useState } from 'react';
import { useWorkflowStore } from '../stores/workflowStore';
import { Workflow } from '@flowcraft/shared-types';
import { Button, Card, Input, Modal } from '@flowcraft/ui';

interface WorkflowListProps {
  onSelectWorkflow?: (workflow: Workflow) => void;
  onEditWorkflow?: (workflow: Workflow) => void;
  onDeleteWorkflow?: (workflow: Workflow) => void;
}

export const WorkflowList: React.FC<WorkflowListProps> = ({
  onSelectWorkflow,
  onEditWorkflow,
  onDeleteWorkflow,
}) => {
  const {
    workflows,
    isLoading,
    error,
    pagination,
    filters,
    fetchWorkflows,
    deleteWorkflow,
    duplicateWorkflow,
    toggleWorkflowStatus,
    setFilters,
    setPagination,
  } = useWorkflowStore();

  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [statusFilter, setStatusFilter] = useState(filters.status || '');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(
    null
  );
  const [duplicateName, setDuplicateName] = useState('');
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [workflowToDuplicate, setWorkflowToDuplicate] =
    useState<Workflow | null>(null);

  useEffect(() => {
    fetchWorkflows({
      page: pagination.page,
      limit: pagination.limit,
      status: statusFilter as any,
      search: searchTerm,
    });
  }, [pagination.page, pagination.limit, statusFilter, searchTerm]);

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

  const confirmDelete = async () => {
    if (workflowToDelete) {
      try {
        await deleteWorkflow(workflowToDelete.id);
        setShowDeleteModal(false);
        setWorkflowToDelete(null);
      } catch (error) {
        console.error('Failed to delete workflow:', error);
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

  const handleToggleStatus = async (workflow: Workflow) => {
    try {
      const newStatus = workflow.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      await toggleWorkflowStatus(workflow.id, newStatus);
    } catch (error) {
      console.error('Failed to toggle workflow status:', error);
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

  if (isLoading && workflows.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading workflows...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
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

      {/* Workflows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map(workflow => (
          <Card key={workflow.id} className="p-6">
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
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {onSelectWorkflow && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectWorkflow(workflow)}
                >
                  Open
                </Button>
              )}
              {onEditWorkflow && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditWorkflow(workflow)}
                >
                  Edit
                </Button>
              )}
              
              {/* Toggle Status Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleStatus(workflow)}
                className={`${
                  workflow.status === 'ACTIVE' 
                    ? 'text-yellow-600 hover:text-yellow-700 border-yellow-300' 
                    : 'text-green-600 hover:text-green-700 border-green-300'
                }`}
              >
                {workflow.status === 'ACTIVE' ? '⏸ Pause' : '▶ Activate'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDuplicate(workflow)}
              >
                Duplicate
              </Button>
              {onDeleteWorkflow && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(workflow)}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {workflows.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No workflows found</div>
          <Button variant="outline">Create your first workflow</Button>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === 1}
            onClick={() => setPagination({ page: pagination.page - 1 })}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => setPagination({ page: pagination.page + 1 })}
          >
            Next
          </Button>
        </div>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Workflow"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete "{workflowToDelete?.name}"? This
            action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={confirmDelete}
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
      >
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Workflow Name
            </label>
            <Input
              type="text"
              value={duplicateName}
              onChange={setDuplicateName}
              placeholder="Enter workflow name"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDuplicateModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmDuplicate} disabled={!duplicateName.trim()}>
              Duplicate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
