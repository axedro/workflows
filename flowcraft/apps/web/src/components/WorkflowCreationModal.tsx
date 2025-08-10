import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  const { createWorkflow, checkWorkflowNameAvailability } = useWorkflowStore();
  const { t } = useTranslation('workflows');
  const { t: tCommon } = useTranslation('common');
  
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    description: initialData.description || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);

  // Debounced name check
  const checkNameAvailability = useCallback(async (name: string) => {
    if (!name.trim() || name.length < 2) {
      setNameAvailable(null);
      setNameSuggestions([]);
      return;
    }

    setIsCheckingName(true);
    try {
      const result = await checkWorkflowNameAvailability({ name: name.trim() });
      setNameAvailable(result.available);
      setNameSuggestions(result.suggestions);
      
      if (!result.available) {
        setErrors(prev => ({ ...prev, name: t('errors.name_already_exists') }));
      } else {
        setErrors(prev => ({ ...prev, name: '' }));
      }
    } catch (error) {
      console.error('Error checking name availability:', error);
      setNameAvailable(null);
      setNameSuggestions([]);
    } finally {
      setIsCheckingName(false);
    }
  }, [checkWorkflowNameAvailability, t]);

  // Debounce the name check
  const debouncedCheckName = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (name: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        checkNameAvailability(name);
      }, 500); // 500ms delay
    };
  }, [checkNameAvailability]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = t('errors.name_required');
    } else if (formData.name.length > 255) {
      newErrors.name = t('errors.name_too_long');
    } else if (nameAvailable === false) {
      newErrors.name = t('errors.name_already_exists');
    }
    
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = t('errors.description_too_long');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && nameAvailable !== false;
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

    // Check name availability when name changes
    if (field === 'name') {
      debouncedCheckName(value);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setFormData(prev => ({ ...prev, name: suggestion }));
    setErrors(prev => ({ ...prev, name: '' }));
    setNameAvailable(true);
    setNameSuggestions([]);
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
              {/* Name validation feedback */}
              <div style={{ marginTop: '0.25rem', minHeight: '1.25rem' }}>
                {isCheckingName && (
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{ 
                      width: '12px', 
                      height: '12px', 
                      border: '2px solid #e5e7eb',
                      borderTop: '2px solid #3b82f6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></span>
                    {t('create.checking_name')}
                  </p>
                )}
                
                {!isCheckingName && nameAvailable === true && formData.name.trim() && (
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>✓</span> {t('create.name_available')}
                  </p>
                )}
                
                {errors.name && (
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#dc2626'
                  }}>
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Name suggestions */}
              {nameSuggestions.length > 0 && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '0.375rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <p style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    {t('create.name_suggestions')}:
                  </p>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    {nameSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.875rem',
                          backgroundColor: '#ffffff',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                          e.currentTarget.style.borderColor = '#9ca3af';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#ffffff';
                          e.currentTarget.style.borderColor = '#d1d5db';
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
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