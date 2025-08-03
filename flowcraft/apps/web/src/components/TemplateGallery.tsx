import React, { useEffect, useState } from 'react';
import { useTemplateStore } from '../stores/templateStore';
import { WorkflowTemplate } from '@flowcraft/shared-types';
import { Button, Card, Input, Modal } from '@flowcraft/ui';

interface TemplateGalleryProps {
  onSelectTemplate?: (template: WorkflowTemplate) => void;
  onEditTemplate?: (template: WorkflowTemplate) => void;
  onDeleteTemplate?: (template: WorkflowTemplate) => void;
  showPublicOnly?: boolean;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  onSelectTemplate,
  onEditTemplate,
  onDeleteTemplate,
  showPublicOnly = false,
}) => {
  const {
    templates,
    publicTemplates,
    categories,
    isLoading,
    error,
    pagination,
    filters,
    fetchTemplates,
    fetchPublicTemplates,
    fetchCategories,
    deleteTemplate,
    duplicateTemplate,
    setFilters,
    setPagination,
  } = useTemplateStore();

  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [categoryFilter, setCategoryFilter] = useState(filters.category || '');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] =
    useState<WorkflowTemplate | null>(null);
  const [duplicateName, setDuplicateName] = useState('');
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [templateToDuplicate, setTemplateToDuplicate] =
    useState<WorkflowTemplate | null>(null);

  const displayedTemplates = showPublicOnly ? publicTemplates : templates;

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (showPublicOnly) {
      fetchPublicTemplates({
        page: pagination.page,
        limit: pagination.limit,
        category: categoryFilter,
        search: searchTerm,
      });
    } else {
      fetchTemplates({
        page: pagination.page,
        limit: pagination.limit,
        category: categoryFilter,
        search: searchTerm,
      });
    }
  }, [
    pagination.page,
    pagination.limit,
    categoryFilter,
    searchTerm,
    showPublicOnly,
  ]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters({ search: value });
    setPagination({ page: 1 });
  };

  const handleCategoryFilter = (category: string) => {
    setCategoryFilter(category);
    setFilters({ category: category || undefined });
    setPagination({ page: 1 });
  };

  const handleDelete = (template: WorkflowTemplate) => {
    setTemplateToDelete(template);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (templateToDelete) {
      try {
        await deleteTemplate(templateToDelete.id);
        setShowDeleteModal(false);
        setTemplateToDelete(null);
      } catch (error) {
        console.error('Failed to delete template:', error);
      }
    }
  };

  const handleDuplicate = (template: WorkflowTemplate) => {
    setTemplateToDuplicate(template);
    setDuplicateName(`${template.name} (Copy)`);
    setShowDuplicateModal(true);
  };

  const confirmDuplicate = async () => {
    if (templateToDuplicate) {
      try {
        await duplicateTemplate(templateToDuplicate.id, duplicateName);
        setShowDuplicateModal(false);
        setTemplateToDuplicate(null);
        setDuplicateName('');
      } catch (error) {
        console.error('Failed to duplicate template:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading && displayedTemplates.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading templates...</div>
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {showPublicOnly ? 'Public Templates' : 'My Templates'}
        </h2>
        {!showPublicOnly && <Button>Create Template</Button>}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={e => handleCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedTemplates.map(template => (
          <Card key={template.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {template.name}
                  </h3>
                  {template.isPublic && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Public
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {template.description || 'No description'}
                </p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                    {template.category}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Created: {formatDate(template.createdAt.toString())}
                </div>
                {/* TODO: Add organization info when type is updated */}
              </div>
            </div>

            <div className="flex gap-2">
              {onSelectTemplate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectTemplate(template)}
                >
                  Use Template
                </Button>
              )}
              {onEditTemplate && !template.isPublic && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditTemplate(template)}
                >
                  Edit
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDuplicate(template)}
              >
                Duplicate
              </Button>
              {onDeleteTemplate && !template.isPublic && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(template)}
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
      {displayedTemplates.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {showPublicOnly
              ? 'No public templates found'
              : 'No templates found'}
          </div>
          {!showPublicOnly && (
            <Button variant="outline">Create your first template</Button>
          )}
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
        title="Delete Template"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete "{templateToDelete?.name}"? This
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
        title="Duplicate Template"
      >
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Template Name
            </label>
            <Input
              type="text"
              value={duplicateName}
              onChange={setDuplicateName}
              placeholder="Enter template name"
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
