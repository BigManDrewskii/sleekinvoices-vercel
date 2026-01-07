import { useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface UndoableDeleteOptions<T> {
  /** The item being deleted */
  item: T;
  /** Display name for the item (shown in toast) */
  itemName: string;
  /** Type of item being deleted (e.g., "client", "invoice") */
  itemType: string;
  /** Function to optimistically remove item from UI */
  onOptimisticDelete: () => void;
  /** Function to restore item to UI (rollback) */
  onRestore: () => void;
  /** Function to permanently delete from server */
  onConfirmDelete: () => Promise<void>;
  /** Delay in milliseconds before permanent deletion (default: 5000) */
  delay?: number;
}

interface PendingDelete {
  toastId: string | number;
  timeoutId: NodeJS.Timeout;
}

/**
 * Hook for managing undoable delete operations.
 * Shows a toast with an "Undo" button for 5 seconds before permanently deleting.
 */
export function useUndoableDelete() {
  const pendingDeletes = useRef<Map<string, PendingDelete>>(new Map());

  const executeDelete = useCallback(async <T>({
    item,
    itemName,
    itemType,
    onOptimisticDelete,
    onRestore,
    onConfirmDelete,
    delay = 5000,
  }: UndoableDeleteOptions<T>) => {
    // Generate a unique key for this delete operation
    const deleteKey = `${itemType}-${Date.now()}-${Math.random()}`;
    
    // Optimistically remove from UI immediately
    onOptimisticDelete();

    // Create the toast with undo action
    const toastId = toast(
      `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} "${itemName}" deleted`,
      {
        description: 'Click undo to restore',
        duration: delay,
        action: {
          label: 'Undo',
          onClick: () => {
            // Cancel the pending delete
            const pending = pendingDeletes.current.get(deleteKey);
            if (pending) {
              clearTimeout(pending.timeoutId);
              pendingDeletes.current.delete(deleteKey);
            }
            
            // Restore the item to UI
            onRestore();
            
            toast.success(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} restored`);
          },
        },
        onDismiss: () => {
          // If toast is dismissed without undo, the timeout will handle deletion
        },
      }
    );

    // Set timeout to permanently delete after delay
    const timeoutId = setTimeout(async () => {
      pendingDeletes.current.delete(deleteKey);
      
      try {
        await onConfirmDelete();
        // Success toast is optional since the item is already removed from UI
      } catch (error) {
        // On error, restore the item and show error message
        onRestore();
        toast.error(`Failed to delete ${itemType}. Item has been restored.`);
      }
    }, delay);

    // Store the pending delete
    pendingDeletes.current.set(deleteKey, { toastId, timeoutId });

    return deleteKey;
  }, []);

  // Cancel all pending deletes (useful for cleanup)
  const cancelAllPending = useCallback(() => {
    pendingDeletes.current.forEach(({ timeoutId }) => {
      clearTimeout(timeoutId);
    });
    pendingDeletes.current.clear();
  }, []);

  return {
    executeDelete,
    cancelAllPending,
  };
}

/**
 * Simpler version for components that don't need the full hook.
 * Shows an undo toast and handles the delete flow.
 */
export async function undoableDelete<T>({
  item,
  itemName,
  itemType,
  onOptimisticDelete,
  onRestore,
  onConfirmDelete,
  delay = 5000,
}: UndoableDeleteOptions<T>): Promise<void> {
  return new Promise((resolve, reject) => {
    let isUndone = false;
    let timeoutId: NodeJS.Timeout;

    // Optimistically remove from UI immediately
    onOptimisticDelete();

    // Create the toast with undo action
    toast(
      `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} "${itemName}" deleted`,
      {
        description: 'Click undo to restore',
        duration: delay,
        action: {
          label: 'Undo',
          onClick: () => {
            isUndone = true;
            clearTimeout(timeoutId);
            
            // Restore the item to UI
            onRestore();
            
            toast.success(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} restored`);
            resolve();
          },
        },
      }
    );

    // Set timeout to permanently delete after delay
    timeoutId = setTimeout(async () => {
      if (isUndone) return;
      
      try {
        await onConfirmDelete();
        resolve();
      } catch (error) {
        // On error, restore the item and show error message
        onRestore();
        toast.error(`Failed to delete ${itemType}. Item has been restored.`);
        reject(error);
      }
    }, delay);
  });
}
