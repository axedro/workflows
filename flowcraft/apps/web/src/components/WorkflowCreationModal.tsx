import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflowStore } from '../stores/workflowStore';
import { Button } from '@flowcraft/ui';
import { useTranslation } from '../hooks/i18n';

interface WorkflowCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    name?: string;
    description?: string;
    definition?: any;
  };
}

export const WorkflowCreationModal: React.FC<WorkflowCreationModalProps> = ({
  isOpen,
  onClose,
  initialData = {},
}) => {
  const navigate = useNavigate();
  const { createWorkflow } = useWorkflowStore();
  const { t } = useTranslation('workflows');
  const { t: tCommon } = useTranslation('common');
  
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    description: initialData.description || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = t('errors.name_required');
    } else if (formData.name.length > 255) {
      newErrors.name = t('errors.name_too_long');
    }
    
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = t('errors.description_too_long');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const workflow = await createWorkflow({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        definition: initialData.definition || {
          nodes: [
            {
              id: 'start',
              type: 'start',
              position: { x: 100, y: 100 },
              data: { label: 'Start' }
            },
            {
              id: 'end',
              type: 'end',
              position: { x: 300, y: 100 },
              data: { label: 'End' }
            }
          ],
          edges: [],
          metadata: {
            author: t('default_author'),
            tags: [],
            difficulty: t('difficulty.beginner')
          }
        },
      });

      // Navigate to the new workflow
      navigate(`/workflow/${workflow.id}`);
      onClose();
    } catch (error) {
      console.error('Failed to create workflow:', error);
      setErrors({ submit: t('errors.create_failed') });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          maxWidth: '28rem',
          width: '100%',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#111827'
          }}>
            {t('create.title')}
          </h2>
          <button
            onClick={onClose}
            style={{
              color: '#9ca3af',
              cursor: 'pointer',
              fontSize: '1.25rem',
              lineHeight: '1'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#4b5563'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label htmlFor="name" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.25rem'
              }}>
                {t('create.name_label')} *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={t('create.name_placeholder')}
                disabled={isLoading}
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: `1px solid ${errors.name ? '#fca5a5' : '#d1d5db'}`,
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = errors.name ? '#fca5a5' : '#d1d5db'}
              />
              {errors.name && (
                <p style={{
                  marginTop: '0.25rem',
                  fontSize: '0.875rem',
                  color: '#dc2626'
                }}>
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="description" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.25rem'
              }}>
                {t('create.description_label')}
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={t('create.description_placeholder')}
                rows={3}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: `1px solid ${errors.description ? '#fca5a5' : '#d1d5db'}`,
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                  resize: 'vertical'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = errors.description ? '#fca5a5' : '#d1d5db'}
              />
              {errors.description && (
                <p style={{
                  marginTop: '0.25rem',
                  fontSize: '0.875rem',
                  color: '#dc2626'
                }}>
                  {errors.description}
                </p>
              )}
            </div>

            {errors.submit && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '0.375rem',
                padding: '0.75rem'
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#991b1b'
                }}>
                  {errors.submit}
                </p>
              </div>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              paddingTop: '1rem'
            }}>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                {tCommon('cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !formData.name.trim()}
              >
                {isLoading ? tCommon('creating') : t('create.create_button')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 