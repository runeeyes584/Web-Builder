import { projectsApi } from '@/api/projects.api';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

interface PageData {
  id: string;
  name: string;
  elements: any[];
  layout?: {
    headerHeight: number;
    footerHeight: number;
    sections: { id: string; height: number; name?: string }[];
  };
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  order: number;
}

interface UseAutoSaveOptions {
  projectId: string | null;
  projectName: string;
  pages: PageData[]; // Multi-page support
  activePageId: string; // Currently active page
  layout?: {
    headerHeight: number;
    footerHeight: number;
    sections: { id: string; height: number; name?: string }[];
  } | null;
  enabled?: boolean;
  interval?: number; // Auto-save interval in milliseconds (default: 30 seconds)
  onSaveSuccess?: () => void;
  onSaveError?: (error: any) => void;
}

export function useAutoSave({
  projectId,
  projectName,
  pages,
  activePageId,
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

  // Merge current layout into active page's layout before saving
  const getPagesWithCurrentLayout = useCallback(() => {
    if (!pages || pages.length === 0) return pages;
    
    return pages.map(page => {
      if (page.id === activePageId && layout) {
        // Merge current canvas layout into active page
        return {
          ...page,
          layout: {
            headerHeight: layout.headerHeight,
            footerHeight: layout.footerHeight,
            sections: layout.sections.map(s => ({ ...s })),
          },
        };
      }
      return page;
    });
  }, [pages, activePageId, layout]);

  const saveProject = useCallback(async () => {
    if (!projectId || !enabled || isSavingRef.current) {
      return;
    }

    // Get pages with current layout merged
    const pagesToSave = getPagesWithCurrentLayout();

    // Check if data has actually changed
    const currentDataStr = JSON.stringify({ pages: pagesToSave });
    if (currentDataStr === lastSavedDataRef.current) {
      return; // No changes, skip save
    }

    try {
      isSavingRef.current = true;
      
      // Use multi-page format for saving
      const response = await projectsApi.update(projectId, {
        name: projectName,
        description: '',
        pages: pagesToSave.map((page, index) => ({
          id: page.id,
          name: page.name,
          elements: page.elements,
          layout: page.layout,
          metadata: page.metadata,
          order: index,
        })),
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
  }, [projectId, projectName, getPagesWithCurrentLayout, enabled, onSaveSuccess, onSaveError]);

  // Initialize only when project changes (NOT when pages change)
  useEffect(() => {
    if (projectId) {
      // Use setTimeout to ensure pages are fully loaded before marking as initialized
      setTimeout(() => {
        const pagesToSave = getPagesWithCurrentLayout();
        lastSavedDataRef.current = JSON.stringify({ pages: pagesToSave });
        isInitializedRef.current = true;
      }, 100); // Small delay to ensure pages are loaded
    } else {
      // Reset when no project is open
      isInitializedRef.current = false;
      lastSavedDataRef.current = '';
    }
  }, [projectId]); // Only depend on projectId, NOT pages!

  // Trigger auto-save when pages or layout change (with debounce)
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
  }, [pages, layout, projectId, enabled, interval, saveProject]);

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
    const pagesToSave = getPagesWithCurrentLayout();
    const currentDataStr = JSON.stringify({ pages: pagesToSave });
    const hasChanges = currentDataStr !== lastSavedDataRef.current;
    return hasChanges;
  }, [projectId, pages, layout, getPagesWithCurrentLayout, saveCounter]); // saveCounter triggers recalculation after save

  return {
    manualSave,
    getLastSaveTime,
    isSaving: isSavingRef.current,
    hasUnsavedChanges,
  };
}
