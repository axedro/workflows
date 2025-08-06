import React, { useCallback, useEffect, useState } from 'react';
import { useReactFlow } from '@reactflow/core';
import { useTranslation } from '../../../hooks/i18n';

interface EnhancedControlsProps {
  showZoom?: boolean;
  showFitView?: boolean;
  showInteractive?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
  onSave?: () => void;
  onExport?: () => void;
  isSaving?: boolean;
  lastSaved?: Date | null;
}

const EnhancedControls: React.FC<EnhancedControlsProps> = ({
  showZoom = true,
  showFitView = true,
  showInteractive: _showInteractive = true,
  position = 'top-right',
  className = '',
  onSave,
  onExport,
  isSaving = false,
  lastSaved = null,
}) => {
  const { t } = useTranslation('common');
  const { zoomIn, zoomOut, fitView, getViewport } = useReactFlow();
  const [currentZoom, setCurrentZoom] = useState(1);

  // Update zoom level when viewport changes
  useEffect(() => {
    const updateZoom = () => {
      const viewport = getViewport();
      setCurrentZoom(Math.round(viewport.zoom * 100) / 100);
    };

    updateZoom();

    // Set up interval to update zoom level
    const interval = setInterval(updateZoom, 100);

    return () => clearInterval(interval);
  }, [getViewport]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key) {
        case '=':
        case '+':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            zoomIn();
          }
          break;
        case '-':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            zoomOut();
          }
          break;
        case '0':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            fitView();
          }
          break;
        case 'Escape':
          // Reset view or clear selection
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut, fitView]);

  const handleZoomIn = useCallback(() => {
    zoomIn();
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut();
  }, [zoomOut]);

  const handleFitView = useCallback(() => {
    fitView();
  }, [fitView]);

  const handleResetView = useCallback(() => {
    fitView({ duration: 800 });
  }, [fitView]);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  return (
    <div className={`absolute ${getPositionClasses()} ${className} z-50`}>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex flex-col gap-1 pointer-events-auto">
        {/* Zoom Level Display */}
        <div className="text-xs text-gray-600 text-center px-2 py-1 bg-gray-50 rounded border">
          {Math.round(currentZoom * 100)}%
        </div>

        {/* Zoom In Button */}
        {showZoom && (
          <button
            onClick={handleZoomIn}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors pointer-events-auto"
            aria-label="Zoom In"
            title="Zoom In (Ctrl/Cmd + +)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
              <path d="M11 8v6" />
              <path d="M8 11h6" />
            </svg>
          </button>
        )}

        {/* Zoom Out Button */}
        {showZoom && (
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors pointer-events-auto"
            aria-label="Zoom Out"
            title="Zoom Out (Ctrl/Cmd + -)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
              <path d="M8 11h6" />
            </svg>
          </button>
        )}

        {/* Fit View Button */}
        {showFitView && (
          <button
            onClick={handleFitView}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors pointer-events-auto"
            aria-label="Fit to View"
            title={t('fit_to_view_shortcut')}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M8 3H5a2 2 0 0 0-2 2v3" />
              <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
              <path d="M3 16v3a2 2 0 0 0 2 2h3" />
              <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
            </svg>
          </button>
        )}

        {/* Reset View Button */}
        <button
          onClick={handleResetView}
          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors pointer-events-auto"
          aria-label="Reset View"
          title="Reset View"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
        </button>

        {/* Save Button */}
        {onSave && (
          <div className="border-t border-gray-200 pt-1 mt-1">
            <button
              onClick={onSave}
              disabled={isSaving}
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors pointer-events-auto disabled:opacity-50"
              aria-label="Save Workflow"
              title={`Save Workflow${lastSaved ? ` (Last saved: ${lastSaved.toLocaleTimeString()})` : ''}`}
            >
              {isSaving ? (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="31.416" strokeDashoffset="31.416">
                    <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite" />
                    <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite" />
                  </circle>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17,21 17,13 7,13 7,21" />
                  <polyline points="7,3 7,8 15,8" />
                </svg>
              )}
            </button>
          </div>
        )}

        {/* Export Button */}
        {onExport && (
          <button
            onClick={onExport}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors pointer-events-auto"
            aria-label="Export Workflow"
            title={t('export_workflow')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        )}

        {/* Keyboard Shortcuts Help */}
        <div className="border-t border-gray-200 pt-1 mt-1">
          <button
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors pointer-events-auto"
            aria-label="Keyboard Shortcuts"
            title="Keyboard Shortcuts: Ctrl/Cmd + + (Zoom In), Ctrl/Cmd + - (Zoom Out), Ctrl/Cmd + 0 (Fit View), Escape (Clear Selection)"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedControls;
