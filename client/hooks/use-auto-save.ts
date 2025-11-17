import { projectsApi } from '@/api/projects.api';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

interface UseAutoSaveOptions {
  projectId: string | null;
  projectName: string;
  elements: any[];
  layout?: {
    headerHeight: number;
    footerHeight: number;
    sections: { id: string; height: number }[];
  } | null;
  enabled?: boolean;
  interval?: number; // Auto-save interval in milliseconds (default: 30 seconds)
  onSaveSuccess?: () => void;
  onSaveError?: (error: any) => void;
}

export function useAutoSave({
  projectId,
  projectName,
  elements,
  layout,
  enabled = true,
  interval = 30000, // 30 seconds
  onSaveSuccess,
  onSaveError,
}: UseAutoSaveOptions) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');
  const isSavingRef = useRef(false);
  const lastSaveTimeRef = useRef<number>(0);
  const isInitializedRef = useRef(false);
  const [saveCounter, setSaveCounter] = useState(0); // Trigger re-render after save

  const saveProject = useCallback(async () => {
    if (!projectId || !enabled || isSavingRef.current) {
      return;
    }

    // Check if elements or layout have actually changed
    const currentDataStr = JSON.stringify({ elements, layout });
    if (currentDataStr === lastSavedDataRef.current) {
      return; // No changes, skip save
    }

    try {
      isSavingRef.current = true;
      
      const response = await projectsApi.update(projectId, {
        name: projectName,
        description: '',
        elements: elements,
        layout: layout || undefined,
      });

      if (response.success) {
        lastSavedDataRef.current = currentDataStr;
        lastSaveTimeRef.current = Date.now();
        setSaveCounter(prev => prev + 1); // Trigger re-render
        onSaveSuccess?.();
        
        // Show subtle toast
        toast.success('Project auto-saved', {
          duration: 2000,
          position: 'bottom-right',
        });
      }
    } catch (error) {
      onSaveError?.(error);
      
      toast.error('Failed to auto-save project', {
        duration: 3000,
        position: 'bottom-right',
      });
    } finally {
      isSavingRef.current = false;
    }
  }, [projectId, projectName, elements, layout, enabled, onSaveSuccess, onSaveError]);

  // Initialize only when project changes (NOT when elements change)
  useEffect(() => {
    if (projectId) {
      // Use setTimeout to ensure elements are fully loaded before marking as initialized
      setTimeout(() => {
        lastSavedDataRef.current = JSON.stringify({ elements, layout });
        isInitializedRef.current = true;
      }, 100); // Small delay to ensure elements are loaded
    } else {
      // Reset when no project is open
      isInitializedRef.current = false;
      lastSavedDataRef.current = '';
    }
  }, [projectId]); // Only depend on projectId, NOT elements or layout!

  // Trigger auto-save when elements or layout change (with debounce)
  useEffect(() => {
    if (!projectId || !enabled || !isInitializedRef.current) {
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(() => {
      saveProject();
    }, interval);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [elements, layout, projectId, enabled, interval, saveProject]);

  // Manual save function (can be called on blur or before closing)
  const manualSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveProject();
  }, [saveProject]);

  // Get last save time
  const getLastSaveTime = useCallback(() => {
    return lastSaveTimeRef.current;
  }, []);

  // Check if there are unsaved changes (only after initialization)
  const hasUnsavedChanges = useMemo(() => {
    if (!projectId || !isInitializedRef.current) return false;
    const currentDataStr = JSON.stringify({ elements, layout });
    const hasChanges = currentDataStr !== lastSavedDataRef.current;
    return hasChanges;
  }, [projectId, elements, layout, saveCounter]); // saveCounter triggers recalculation after save

  return {
    manualSave,
    getLastSaveTime,
    isSaving: isSavingRef.current,
    hasUnsavedChanges,
  };
}
