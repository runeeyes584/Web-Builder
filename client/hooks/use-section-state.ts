"use client"

import { useCallback, useEffect, useRef, useState } from "react"

// Section type
export interface Section {
  id: string
  height: number
  name?: string
}

// Layout type for persistence
export interface SectionLayout {
  headerHeight: number
  footerHeight: number
  sections: Section[]
}

// Default values
export const DEFAULT_HEADER_HEIGHT = 96
export const DEFAULT_FOOTER_HEIGHT = 96
export const DEFAULT_SECTION_HEIGHT = 608 // 800 - 96 - 96
export const MIN_HEADER = 48
export const MIN_FOOTER = 48
export const MIN_SECTION = 128

// Generate a unique section ID
export const generateSectionId = () => `sec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Create default section
export const createDefaultSection = (): Section => ({
  id: generateSectionId(),
  height: DEFAULT_SECTION_HEIGHT,
})

// Create default layout
export const createDefaultLayout = (): SectionLayout => ({
  headerHeight: DEFAULT_HEADER_HEIGHT,
  footerHeight: DEFAULT_FOOTER_HEIGHT,
  sections: [createDefaultSection()],
})

// Deep clone layout to avoid shared references
export const cloneLayout = (layout: SectionLayout): SectionLayout => ({
  headerHeight: layout.headerHeight,
  footerHeight: layout.footerHeight,
  sections: layout.sections.map(s => ({ ...s })),
})

// Validate and normalize layout
export const normalizeLayout = (layout: SectionLayout | null | undefined): SectionLayout => {
  if (!layout) {
    return createDefaultLayout()
  }

  return {
    headerHeight: Math.max(MIN_HEADER, layout.headerHeight || DEFAULT_HEADER_HEIGHT),
    footerHeight: Math.max(MIN_FOOTER, layout.footerHeight || DEFAULT_FOOTER_HEIGHT),
    sections: layout.sections && layout.sections.length > 0
      ? layout.sections.map(s => ({
          id: s.id || generateSectionId(),
          height: Math.max(MIN_SECTION, s.height || DEFAULT_SECTION_HEIGHT),
          name: s.name,
        }))
      : [createDefaultSection()],
  }
}

interface UseSectionStateOptions {
  initialLayout?: SectionLayout | null
  pageId?: string
  onLayoutChange?: (layout: SectionLayout) => void
  onSectionsChange?: (sections: Section[], headerHeight: number, footerHeight: number) => void
}

/**
 * Hook to manage section state for a page
 * Handles synchronization between pages and proper state reset on page switch
 */
export function useSectionState({
  initialLayout,
  pageId,
  onLayoutChange,
  onSectionsChange,
}: UseSectionStateOptions) {
  // Track current page to detect page switches
  const currentPageIdRef = useRef<string | undefined>(pageId)
  const isInitialMountRef = useRef(true)
  
  // Initialize state from layout
  const getInitialState = useCallback(() => normalizeLayout(initialLayout), [])
  
  const [headerHeight, setHeaderHeight] = useState<number>(() => getInitialState().headerHeight)
  const [footerHeight, setFooterHeight] = useState<number>(() => getInitialState().footerHeight)
  const [sections, setSections] = useState<Section[]>(() => getInitialState().sections)

  // Track previous layout for comparison
  const prevLayoutRef = useRef<SectionLayout | null | undefined>(initialLayout)
  const layoutUpdatePendingRef = useRef(false)

  // Detect page switch and reset state accordingly
  useEffect(() => {
    const prevPageId = currentPageIdRef.current
    currentPageIdRef.current = pageId

    // Skip initial mount
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false
      return
    }

    // If page changed, reset to the new page's layout
    if (prevPageId !== pageId) {
      const newLayout = normalizeLayout(initialLayout)
      setHeaderHeight(newLayout.headerHeight)
      setFooterHeight(newLayout.footerHeight)
      setSections(newLayout.sections)
      prevLayoutRef.current = initialLayout
    }
  }, [pageId, initialLayout])

  // Sync when initialLayout changes (e.g., from collaboration)
  useEffect(() => {
    const prev = prevLayoutRef.current
    prevLayoutRef.current = initialLayout

    // Skip if we're in the middle of a local update
    if (layoutUpdatePendingRef.current) {
      layoutUpdatePendingRef.current = false
      return
    }

    // Skip initial mount
    if (isInitialMountRef.current) {
      return
    }

    // Skip if same reference
    if (prev === initialLayout) {
      return
    }

    // Check if this is a structural change (different section IDs or count)
    const prevNormalized = normalizeLayout(prev)
    const newNormalized = normalizeLayout(initialLayout)

    const isStructuralChange =
      newNormalized.sections.length !== prevNormalized.sections.length ||
      !newNormalized.sections.every((s, idx) => s.id === prevNormalized.sections[idx]?.id)

    if (isStructuralChange) {
      // Full layout reset for structural changes (e.g., from collaboration)
      setHeaderHeight(newNormalized.headerHeight)
      setFooterHeight(newNormalized.footerHeight)
      setSections(newNormalized.sections)
      return
    }

    // Check for name changes only (without height changes)
    const isNameOnlyChange = newNormalized.sections.some((s, idx) => 
      s.name !== prevNormalized.sections[idx]?.name &&
      s.height === prevNormalized.sections[idx]?.height
    )

    if (isNameOnlyChange) {
      setSections(currentSections =>
        currentSections.map((s, idx) => ({
          ...s,
          name: newNormalized.sections[idx]?.name,
        }))
      )
    }
  }, [initialLayout])

  // Get current layout
  const getLayout = useCallback((): SectionLayout => ({
    headerHeight,
    footerHeight,
    sections: sections.map(s => ({ ...s })),
  }), [headerHeight, footerHeight, sections])

  // Calculate total sections height
  const totalSectionsHeight = sections.reduce((sum, s) => sum + s.height, 0)
  const contentHeight = headerHeight + totalSectionsHeight + footerHeight

  // Notify parent of layout changes (debounced)
  const layoutChangeTimerRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    if (!onLayoutChange || isInitialMountRef.current) return

    if (layoutChangeTimerRef.current) {
      clearTimeout(layoutChangeTimerRef.current)
    }

    layoutChangeTimerRef.current = setTimeout(() => {
      layoutUpdatePendingRef.current = true
      onLayoutChange(getLayout())
    }, 100)

    return () => {
      if (layoutChangeTimerRef.current) {
        clearTimeout(layoutChangeTimerRef.current)
      }
    }
  }, [headerHeight, footerHeight, sections, onLayoutChange, getLayout])

  // Add section
  const addSection = useCallback((index: number, section?: Partial<Section>) => {
    const newSection: Section = {
      id: section?.id || generateSectionId(),
      height: Math.max(MIN_SECTION, section?.height || DEFAULT_SECTION_HEIGHT),
      name: section?.name,
    }

    setSections(prev => {
      const newSections = [...prev]
      newSections.splice(index, 0, newSection)
      
      // Notify parent about section change
      if (onSectionsChange) {
        setTimeout(() => onSectionsChange(newSections, headerHeight, footerHeight), 0)
      }
      
      return newSections
    })

    return newSection
  }, [headerHeight, footerHeight, onSectionsChange])

  // Remove section
  const removeSection = useCallback((index: number) => {
    setSections(prev => {
      if (prev.length <= 1) {
        // Cannot remove last section
        return prev
      }

      const newSections = prev.filter((_, i) => i !== index)
      
      // Notify parent about section change
      if (onSectionsChange) {
        setTimeout(() => onSectionsChange(newSections, headerHeight, footerHeight), 0)
      }
      
      return newSections
    })
  }, [headerHeight, footerHeight, onSectionsChange])

  // Update section
  const updateSection = useCallback((index: number, updates: Partial<Section>) => {
    setSections(prev => {
      const newSections = prev.map((s, i) => 
        i === index ? { ...s, ...updates, height: Math.max(MIN_SECTION, updates.height ?? s.height) } : s
      )
      return newSections
    })
  }, [])

  // Move section
  const moveSection = useCallback((fromIndex: number, toIndex: number) => {
    setSections(prev => {
      if (fromIndex < 0 || fromIndex >= prev.length || toIndex < 0 || toIndex >= prev.length) {
        return prev
      }

      const newSections = [...prev]
      const [removed] = newSections.splice(fromIndex, 1)
      newSections.splice(toIndex, 0, removed)
      
      // Notify parent about section change
      if (onSectionsChange) {
        setTimeout(() => onSectionsChange(newSections, headerHeight, footerHeight), 0)
      }
      
      return newSections
    })
  }, [headerHeight, footerHeight, onSectionsChange])

  // Update header height
  const updateHeaderHeight = useCallback((height: number) => {
    setHeaderHeight(Math.max(MIN_HEADER, height))
  }, [])

  // Update footer height
  const updateFooterHeight = useCallback((height: number) => {
    setFooterHeight(Math.max(MIN_FOOTER, height))
  }, [])

  // Reset to layout
  const resetToLayout = useCallback((layout: SectionLayout | null | undefined) => {
    const normalized = normalizeLayout(layout)
    setHeaderHeight(normalized.headerHeight)
    setFooterHeight(normalized.footerHeight)
    setSections(normalized.sections)
    prevLayoutRef.current = layout
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      if (layoutChangeTimerRef.current) {
        clearTimeout(layoutChangeTimerRef.current)
      }
    }
  }, [])

  return {
    // State
    headerHeight,
    footerHeight,
    sections,
    totalSectionsHeight,
    contentHeight,
    
    // Setters (for direct updates during resize)
    setHeaderHeight: updateHeaderHeight,
    setFooterHeight: updateFooterHeight,
    setSections,
    
    // Actions
    addSection,
    removeSection,
    updateSection,
    moveSection,
    resetToLayout,
    getLayout,
    
    // Constants
    MIN_HEADER,
    MIN_FOOTER,
    MIN_SECTION,
    DEFAULT_SECTION_HEIGHT,
  }
}
