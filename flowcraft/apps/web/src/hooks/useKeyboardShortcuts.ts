import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../stores/notificationStore';

interface KeyboardShortcutOptions {
  enableGlobalShortcuts?: boolean;
  enableEditorShortcuts?: boolean;
  onSave?: () => void;
  onExport?: () => void;
}

export const useKeyboardShortcuts = (options: KeyboardShortcutOptions = {}) => {
  const {
    enableGlobalShortcuts = true,
    enableEditorShortcuts = false,
    onSave,
    onExport,
  } = options;
  
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      // Skip if typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
      const isModKey = ctrlKey || metaKey;

      // Global shortcuts
      if (enableGlobalShortcuts) {
        // Ctrl/Cmd + K - Search/Command palette
        if (isModKey && key === 'k' && !shiftKey && !altKey) {
          event.preventDefault();
          addNotification({
            type: 'info',
            title: 'Search',
            message: 'Search functionality coming soon!',
            duration: 2000,
          });
          return;
        }

        // Ctrl/Cmd + N - New workflow
        if (isModKey && key === 'n' && !shiftKey && !altKey) {
          event.preventDefault();
          navigate('/workflow/new');
          return;
        }

        // Ctrl/Cmd + D - Dashboard
        if (isModKey && key === 'd' && !shiftKey && !altKey) {
          event.preventDefault();
          navigate('/dashboard');
          return;
        }

        // Ctrl/Cmd + W - Workflows page
        if (isModKey && key === 'w' && !shiftKey && !altKey) {
          event.preventDefault();
          navigate('/workflows');
          return;
        }

        // H - Show help/shortcuts
        if (key === 'h' && !isModKey && !shiftKey && !altKey) {
          event.preventDefault();
          addNotification({
            type: 'info',
            title: 'Keyboard Shortcuts',
            message: 'Ctrl+N: New workflow • Ctrl+D: Dashboard • Ctrl+W: Workflows • Ctrl+K: Search • H: Help',
            duration: 8000,
          });
          return;
        }

        // ? - Show keyboard shortcuts
        if (key === '?' && !isModKey && !shiftKey && !altKey) {
          event.preventDefault();
          addNotification({
            type: 'info',
            title: 'Keyboard Shortcuts',
            message: 'Ctrl+N: New workflow • Ctrl+D: Dashboard • Ctrl+W: Workflows • Ctrl+S: Save • Ctrl+E: Export • ESC: Clear notifications',
            duration: 10000,
          });
          return;
        }
      }

      // Editor-specific shortcuts
      if (enableEditorShortcuts) {
        // Ctrl/Cmd + S - Save
        if (isModKey && key === 's' && !shiftKey && !altKey) {
          event.preventDefault();
          if (onSave) {
            onSave();
          } else {
            addNotification({
              type: 'warning',
              title: 'Save',
              message: 'Save functionality not available in this context.',
              duration: 2000,
            });
          }
          return;
        }

        // Ctrl/Cmd + E - Export
        if (isModKey && key === 'e' && !shiftKey && !altKey) {
          event.preventDefault();
          if (onExport) {
            onExport();
          } else {
            addNotification({
              type: 'warning',
              title: 'Export',
              message: 'Export functionality not available in this context.',
              duration: 2000,
            });
          }
          return;
        }

        // Ctrl/Cmd + Z - Undo (placeholder)
        if (isModKey && key === 'z' && !shiftKey && !altKey) {
          event.preventDefault();
          addNotification({
            type: 'info',
            title: 'Undo',
            message: 'Undo functionality coming soon!',
            duration: 2000,
          });
          return;
        }

        // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y - Redo (placeholder)
        if (
          (isModKey && key === 'z' && shiftKey && !altKey) ||
          (isModKey && key === 'y' && !shiftKey && !altKey)
        ) {
          event.preventDefault();
          addNotification({
            type: 'info',
            title: 'Redo',
            message: 'Redo functionality coming soon!',
            duration: 2000,
          });
          return;
        }
      }

      // ESC - Clear notifications (always available)
      if (key === 'Escape' && !isModKey && !shiftKey && !altKey) {
        const { notifications } = useNotificationStore.getState();
        if (notifications.length > 0) {
          event.preventDefault();
          useNotificationStore.getState().clearAllNotifications();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [
    enableGlobalShortcuts,
    enableEditorShortcuts,
    navigate,
    addNotification,
    onSave,
    onExport,
  ]);

  return {
    // Expose some helper functions if needed
    showShortcutsHelp: () => {
      addNotification({
        type: 'info',
        title: 'Keyboard Shortcuts',
        message: 'Ctrl+N: New workflow • Ctrl+D: Dashboard • Ctrl+W: Workflows • Ctrl+S: Save • Ctrl+E: Export • ESC: Clear notifications',
        duration: 10000,
      });
    },
  };
};