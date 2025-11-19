"use client"

import React from "react"

interface SiteStylePanelProps {
  canEdit?: boolean
}

export function SiteStylePanel({ canEdit = true }: SiteStylePanelProps) {
  return (
    <div className="h-full flex flex-col text-sm">
      <div className="p-3 border-b border-border">
        <h3 className="font-semibold">Site Style</h3>
        <p className="text-xs text-muted-foreground">(Placeholder) Configure global styles</p>
      </div>
      <div className="p-3 space-y-3 overflow-auto">
        <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
          Global style configuration UI will appear here.
        </div>
        {!canEdit && (
          <div className="text-xs text-yellow-600 bg-yellow-500/10 border border-yellow-500/30 rounded-md p-2">
            View only: cannot edit styles.
          </div>
        )}
      </div>
    </div>
  )
}
