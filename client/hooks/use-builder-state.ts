"use client"

import { editHistoryApi } from "@/api/editHistory.api"
import type { Breakpoint, BuilderElement, BuilderPage, PageMetadata, SnapSettings } from "@/lib/builder-types"
import { useUser } from "@clerk/nextjs"
import { useCallback, useEffect, useRef, useState } from "react"

// Giới hạn lịch sử tối đa 50 bước để tránh tốn bộ nhớ
const MAX_HISTORY_SIZE = 50

// Deep clone helper function to avoid shared references
const deepCloneElement = (el: BuilderElement): BuilderElement => {
  return {
    ...el,
    styles: { ...el.styles },
    responsiveStyles: el.responsiveStyles ? {
      desktop: { ...el.responsiveStyles.desktop },
      tablet: { ...el.responsiveStyles.tablet },
      mobile: { ...el.responsiveStyles.mobile },
    } : undefined,
    position: el.position ? { ...el.position } : undefined,
    animations: el.animations ? { ...el.animations } : undefined,
    props: el.props ? { ...el.props } : undefined,
    children: el.children ? el.children.map(deepCloneElement) : undefined,
  }
}

export function useBuilderState() {
  const { user } = useUser()
  
  // Multi-page state
  const [pages, setPages] = useState<BuilderPage[]>([
    {
      id: `page-${Date.now()}`,
      name: "Main Page",
      elements: [
        {
          id: "1",
          type: "heading",
          content: "Welcome to Your Website",
          styles: { fontSize: "2rem", marginBottom: "1rem" },
          responsiveStyles: {
            desktop: { fontSize: "2rem" },
            tablet: { fontSize: "1.75rem" },
            mobile: { fontSize: "1.5rem" },
          },
          position: { x: 50, y: 50, width: 400, height: 60 },
        },
        {
          id: "2",
          type: "paragraph",
          content: "This is a sample paragraph. Click to edit or drag new elements from the sidebar.",
          styles: { marginBottom: "1rem", color: "var(--color-muted-foreground)" },
          responsiveStyles: {
            desktop: { fontSize: "1rem", lineHeight: "1.6" },
            tablet: { fontSize: "0.95rem", lineHeight: "1.5" },
            mobile: { fontSize: "0.9rem", lineHeight: "1.4" },
          },
          position: { x: 50, y: 130, width: 500, height: 80 },
        },
      ],
      order: 0,
      metadata: {
        title: "Main Page",
      },
    },
  ])
  const [activePageId, setActivePageId] = useState<string>(pages[0].id)
  const [currentPageId, setCurrentPageId] = useState<string | null>(null)
  
  // Track last action to prevent duplicates
  const lastActionRef = useRef<{ action: string; elementId: string; timestamp: number } | null>(null)
  
  // Get current active page
  const activePage = pages.find(p => p.id === activePageId)
  const elements = activePage?.elements || []
  
  // Debounce timers
  const moveDebounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const updateDebounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const [selectedElements, setSelectedElements] = useState<string[]>([])
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>("desktop")
  const [draggedElement, setDraggedElement] = useState<string | null>(null)
  const [history, setHistory] = useState<BuilderElement[][]>([elements])
  const [historyIndex, setHistoryIndex] = useState(0)

  const [snapSettings, setSnapSettings] = useState<SnapSettings>({
    enabled: true,
    gridSize: 10,
    snapToElements: true,
    snapDistance: 5,
  })

  const [showSections, setShowSections] = useState<boolean>(false)
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false)

  // Helper function để giới hạn kích thước history
  const addToHistory = useCallback((newState: BuilderElement[][]) => {
    // Nếu history vượt quá MAX_HISTORY_SIZE, xóa các bước cũ nhất
    if (newState.length > MAX_HISTORY_SIZE) {
      return newState.slice(newState.length - MAX_HISTORY_SIZE)
    }
    return newState
  }, [])

  // Cleanup timers khi component unmount
  useEffect(() => {
    return () => {
      // Dọn dẹp tất cả timers khi component bị unmount
      if (moveDebounceTimerRef.current) {
        clearTimeout(moveDebounceTimerRef.current)
        moveDebounceTimerRef.current = null
      }
      if (updateDebounceTimerRef.current) {
        clearTimeout(updateDebounceTimerRef.current)
        updateDebounceTimerRef.current = null
      }
    }
  }, [])

  // Helper function to save action to database (with duplicate prevention)
  const saveActionToDB = useCallback(async (
    action: 'ADD' | 'UPDATE' | 'DELETE' | 'DUPLICATE' | 'MOVE',
    componentSnapshot: any
  ) => {
    // Only save if we have pageId and user
    if (!currentPageId || !user?.id) {
      return
    }

    // Prevent duplicate saves within 1 second
    const now = Date.now()
    const lastAction = lastActionRef.current
    const elementId = componentSnapshot?.id || 'unknown'
    
    if (
      lastAction &&
      lastAction.action === action &&
      lastAction.elementId === elementId &&
      now - lastAction.timestamp < 1000 // 1 second debounce
    ) {
      return
    }

    // Update last action tracker
    lastActionRef.current = { action, elementId, timestamp: now }

    try {
      await editHistoryApi.createHistory({
        page_id: currentPageId,
        clerk_id: user.id,
        action,
        component_snapshot: componentSnapshot,
      })
    } catch (error) {
      console.error(`Failed to save ${action} to DB:`, error)
    }
  }, [currentPageId, user])

  const addElement = useCallback((element: BuilderElement, position?: { x: number; y: number }) => {
    setPages((prevPages) => {
      return prevPages.map(page => {
        if (page.id !== activePageId) return page
        
        const basePosition = element.position || { x: 100, y: 100, width: 200, height: 50 }
        const mergedPosition = position ? { ...basePosition, ...position } : basePosition
        const newElement = {
          ...element,
          position: mergedPosition,
        }
        const newElements = [...page.elements, newElement]
        
        // Save to local history (for Undo/Redo) với giới hạn kích thước
        setHistory((hist) => {
          const newHistory = [...hist.slice(0, historyIndex + 1), newElements]
          return addToHistory(newHistory)
        })
        setHistoryIndex((idx) => idx + 1)
        
        // Save to database (async, non-blocking)
        saveActionToDB('ADD', newElement)
        
        return { ...page, elements: newElements }
      })
    })
  }, [activePageId, historyIndex, saveActionToDB, addToHistory])

  const updateElement = useCallback((id: string, updates: Partial<BuilderElement>) => {
    setPages((prevPages) => {
      return prevPages.map(page => {
        if (page.id !== activePageId) return page
        
        const newElements = page.elements.map((el) => {
          if (el.id === id) {
            // Deep merge to avoid shared references
            const updated = {
              ...el,
              ...updates,
              styles: updates.styles ? { ...el.styles, ...updates.styles } : el.styles,
              responsiveStyles: updates.responsiveStyles ? {
                desktop: { ...el.responsiveStyles?.desktop, ...updates.responsiveStyles.desktop },
                tablet: { ...el.responsiveStyles?.tablet, ...updates.responsiveStyles.tablet },
                mobile: { ...el.responsiveStyles?.mobile, ...updates.responsiveStyles.mobile },
              } : el.responsiveStyles,
              position: updates.position ? { ...el.position, ...updates.position } : el.position,
              animations: updates.animations ? { ...el.animations, ...updates.animations } : el.animations,
              props: updates.props ? { ...el.props, ...updates.props } : el.props,
            };
            
            // Debounce UPDATE action (chỉ save sau 1 giây không có changes nữa)
            if (updateDebounceTimerRef.current) {
              clearTimeout(updateDebounceTimerRef.current)
            }
            
            updateDebounceTimerRef.current = setTimeout(() => {
              saveActionToDB('UPDATE', updated)
            }, 1000) // Đợi 1 giây sau khi user ngừng gõ
            
            return updated;
          }
          return el;
        });
        
        // Save to local history (ngay lập tức cho Undo/Redo) với giới hạn kích thước
        setHistory((hist) => {
          const newHistory = [...hist.slice(0, historyIndex + 1), newElements]
          return addToHistory(newHistory)
        })
        setHistoryIndex((idx) => idx + 1)
        
        return { ...page, elements: newElements }
      })
    })
  }, [activePageId, historyIndex, saveActionToDB, addToHistory])

  const updateElementResponsiveStyle = useCallback(
    (id: string, breakpoint: Breakpoint, styles: Record<string, any>) => {
      setPages((prevPages) =>
        prevPages.map(page => {
          if (page.id !== activePageId) return page
          
          return {
            ...page,
            elements: page.elements.map((el) => {
              if (el.id === id) {
                return {
                  ...el,
                  responsiveStyles: {
                    ...el.responsiveStyles,
                    [breakpoint]: {
                      ...el.responsiveStyles?.[breakpoint],
                      ...styles,
                    },
                  },
                }
              }
              return el
            })
          }
        })
      )
    },
    [activePageId],
  )

  const deleteElement = useCallback((id: string) => {
    setPages((prevPages) => {
      return prevPages.map(page => {
        if (page.id !== activePageId) return page
        
        // Get element before deleting (để lưu vào history)
        const deletedElement = page.elements.find((el) => el.id === id)
        const newElements = page.elements.filter((el) => el.id !== id)
        
        // Save to local history với giới hạn kích thước
        setHistory((hist) => {
          const newHistory = [...hist.slice(0, historyIndex + 1), newElements]
          return addToHistory(newHistory)
        })
        setHistoryIndex((idx) => idx + 1)
        
        // Save to database (async)
        if (deletedElement) {
          saveActionToDB('DELETE', deletedElement)
        }
        
        return { ...page, elements: newElements }
      })
    })
    setSelectedElements((prev) => prev.filter((elId) => elId !== id))
  }, [activePageId, historyIndex, saveActionToDB, addToHistory])

  const duplicateElement = useCallback(
    (id: string) => {
      setPages((prevPages) => {
        return prevPages.map(page => {
          if (page.id !== activePageId) return page
          
          const element = page.elements.find((el) => el.id === id)
          if (!element) return page
          
          const newElement = {
            ...element,
            id: `${element.id}-copy-${Date.now()}`,
          }
          
          const newElements = [...page.elements, newElement]
          
          // Save to local history với giới hạn kích thước
          setHistory((hist) => {
            const newHistory = [...hist.slice(0, historyIndex + 1), newElements]
            return addToHistory(newHistory)
          })
          setHistoryIndex((idx) => idx + 1)
          
          // Save to database (async)
          saveActionToDB('DUPLICATE', newElement)
          
          return { ...page, elements: newElements }
        })
      })
    },
    [activePageId, historyIndex, saveActionToDB, addToHistory],
  )

  const updateElementPosition = useCallback(
    (id: string, position: { x: number; y: number; width?: number; height?: number }) => {
      setPages((prevPages) => {
        return prevPages.map(page => {
          if (page.id !== activePageId) return page
          
          const newElements = page.elements.map((el) => {
            if (el.id === id) {
              const movedElement = { ...el, position: { ...el.position, ...position } }
              
              // Debounce MOVE action (chỉ save sau 500ms không có movement nữa)
              if (moveDebounceTimerRef.current) {
                clearTimeout(moveDebounceTimerRef.current)
              }
              
              moveDebounceTimerRef.current = setTimeout(() => {
                saveActionToDB('MOVE', movedElement)
              }, 500) // Đợi 500ms sau khi user ngừng drag
              
              return movedElement
            }
            return el
          })
          
          // Save to local history với giới hạn kích thước
          setHistory((hist) => {
            const newHistory = [...hist.slice(0, historyIndex + 1), newElements]
            return addToHistory(newHistory)
          })
          setHistoryIndex((idx) => idx + 1)
          
          return { ...page, elements: newElements }
        })
      })
    },
    [activePageId, historyIndex, saveActionToDB, addToHistory],
  )

  const snapToGrid = useCallback((value: number, gridSize: number) => {
    return Math.round(value / gridSize) * gridSize
  }, [])

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      const historyElements = history[newIndex]
      
      // Deep clone to avoid shared references
      const newElements = historyElements.map(deepCloneElement)
      
      setPages((prevPages) =>
        prevPages.map(page =>
          page.id === activePageId ? { ...page, elements: newElements } : page
        )
      )
    }
  }, [history, historyIndex, activePageId])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      const historyElements = history[newIndex]
      
      // Deep clone to avoid shared references
      const newElements = historyElements.map(deepCloneElement)
      
      setPages((prevPages) =>
        prevPages.map(page =>
          page.id === activePageId ? { ...page, elements: newElements } : page
        )
      )
    }
  }, [history, historyIndex, activePageId])

  const saveToHistory = useCallback(() => {
    const currentElements = pages.find(p => p.id === activePageId)?.elements || []
    
    // Deep clone before saving to history
    const clonedElements = currentElements.map(deepCloneElement)
    
    setHistory((prev) => {
      const newHistory = [...prev.slice(0, historyIndex + 1), clonedElements]
      return addToHistory(newHistory)
    })
    setHistoryIndex((prev) => prev + 1)
  }, [pages, activePageId, historyIndex, addToHistory])

  const loadProject = useCallback((newPages: BuilderPage[]) => {
    // Deep clone to avoid shared references between pages
    const clonedPages = newPages.map(page => ({
      ...page,
      elements: page.elements.map(deepCloneElement),
      layout: page.layout ? {
        headerHeight: page.layout.headerHeight,
        footerHeight: page.layout.footerHeight,
        sections: page.layout.sections.map(s => ({ ...s })),
      } : undefined,
      metadata: page.metadata ? { ...page.metadata } : undefined,
    }))
    
    setPages(clonedPages)
    setActivePageId(clonedPages[0]?.id || '')
    setSelectedElements([])
    setHistory([clonedPages[0]?.elements || []])
    setHistoryIndex(0)
    
    // Set pageId để có thể save history
    if (clonedPages[0]?.id) {
      setCurrentPageId(clonedPages[0].id)
    }
  }, [])
  
  // Page management functions
  const addPage = useCallback((name: string, metadata?: PageMetadata) => {
    const newPage: BuilderPage = {
      id: `page-${Date.now()}`,
      name,
      elements: [],
      order: pages.length,
      metadata: metadata || { title: name },
    }
    
    setPages(prev => [...prev, newPage])
    setActivePageId(newPage.id)
    setCurrentPageId(newPage.id)
    setHistory([[]])
    setHistoryIndex(0)
  }, [pages.length])
  
  const deletePage = useCallback(async (pageId: string) => {
    // Delete from database first if it's a saved page (not a temporary page)
    if (!pageId.startsWith('page-')) {
      try {
        const { pagesApi } = await import('@/api/pages.api')
        const result = await pagesApi.delete(pageId)
        
        if (!result.success) {
          console.error('Failed to delete page from database:', result.message)
          throw new Error(result.message || 'Failed to delete page')
        }
      } catch (error) {
        console.error('Error deleting page from database:', error)
        // Still proceed with UI update even if API fails
      }
    }

    setPages(prev => {
      const filtered = prev.filter(p => p.id !== pageId)
      // Reorder after delete
      return filtered.map((p, idx) => ({ ...p, order: idx }))
    })
    
    // Switch to another page if current page is deleted
    if (pageId === activePageId) {
      const remainingPages = pages.filter(p => p.id !== pageId)
      if (remainingPages.length > 0) {
        setActivePageId(remainingPages[0].id)
        setCurrentPageId(remainingPages[0].id)
      }
    }
  }, [pages, activePageId])
  
  const duplicatePage = useCallback((pageId: string) => {
    const pageToDuplicate = pages.find(p => p.id === pageId)
    if (!pageToDuplicate) return
    
    // Deep clone function for duplication with new IDs
    const deepCloneElementWithNewId = (el: BuilderElement): BuilderElement => {
      const cloned = deepCloneElement(el)
      return {
        ...cloned,
        id: `${el.id}-copy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        children: cloned.children ? cloned.children.map(deepCloneElementWithNewId) : undefined,
      }
    }
    
    const newPage: BuilderPage = {
      ...pageToDuplicate,
      id: `page-${Date.now()}`,
      name: `${pageToDuplicate.name} (Copy)`,
      order: pages.length,
      // Deep clone all elements to avoid shared references
      elements: pageToDuplicate.elements.map(deepCloneElementWithNewId),
      // Deep clone layout if exists
      layout: pageToDuplicate.layout ? {
        headerHeight: pageToDuplicate.layout.headerHeight,
        footerHeight: pageToDuplicate.layout.footerHeight,
        sections: pageToDuplicate.layout.sections.map(s => ({ ...s })),
      } : undefined,
      // Deep clone metadata if exists
      metadata: pageToDuplicate.metadata ? { ...pageToDuplicate.metadata } : undefined,
    }
    
    setPages(prev => [...prev, newPage])
    setActivePageId(newPage.id)
    setCurrentPageId(newPage.id)
  }, [pages])
  
  const renamePage = useCallback(async (pageId: string, newName: string) => {
    // Update local state immediately for better UX
    setPages(prev =>
      prev.map(p => p.id === pageId ? { ...p, name: newName } : p)
    )
    
    // Save to database only if page exists in DB (not temporary ID)
    // Temporary IDs start with "page-", DB IDs are ObjectId format
    if (!pageId.startsWith('page-')) {
      try {
        const { pagesApi } = await import('@/api/pages.api')
        await pagesApi.update(pageId, { name: newName })
      } catch (error) {
        console.error('Failed to rename page in database:', error)
        // Optionally: show toast notification to user
      }
    }
  }, [])
  
  const switchPage = useCallback((pageId: string) => {
    const page = pages.find(p => p.id === pageId)
    if (!page) return
    
    // Deep clone elements before setting to history to avoid shared references
    const clonedElements = page.elements.map(deepCloneElement)
    
    setActivePageId(pageId)
    setCurrentPageId(pageId)
    setSelectedElements([])
    setHistory([clonedElements])
    setHistoryIndex(0)
  }, [pages])
  
  const updatePageMetadata = useCallback((pageId: string, metadata: PageMetadata) => {
    setPages(prev =>
      prev.map(p => p.id === pageId ? { ...p, metadata: { ...p.metadata, ...metadata } } : p)
    )
  }, [])

  return {
    // Elements (from active page)
    elements,
    selectedElements,
    setSelectedElements,
    currentBreakpoint,
    setCurrentBreakpoint,
    draggedElement,
    setDraggedElement,
    snapSettings,
    setSnapSettings,
    showSections,
    setShowSections,
    isPreviewMode,
    setIsPreviewMode,
    addElement,
    updateElement,
    updateElementResponsiveStyle,
    updateElementPosition,
    deleteElement,
    duplicateElement,
    undo,
    redo,
    saveToHistory,
    snapToGrid,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    loadProject,
    currentPageId,
    setCurrentPageId,
    // Multi-page functions
    pages,
    activePageId,
    addPage,
    deletePage,
    duplicatePage,
    renamePage,
    switchPage,
    updatePageMetadata,
  }
}
