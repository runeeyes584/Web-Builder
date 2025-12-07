'use client'

import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import * as React from 'react'

import { cn } from '@/lib/utils'

function TooltipProvider({
  delayDuration = 200,
  skipDelayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
      {...props}
    />
  )
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  )
}

function TooltipTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      className={cn(
        'cursor-help transition-all duration-200 hover:scale-105 hover:brightness-110',
        className
      )}
      {...props}
    />
  )
}

function TooltipContent({
  className,
  sideOffset = 4,
  children,
  side = 'top',
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        side={side}
        className={cn(
          // Base styles
          'z-[100] w-fit origin-center rounded-lg px-3 py-2 text-xs text-balance shadow-lg',
          // Background with gradient and glow effect
          'bg-gradient-to-br from-popover via-popover to-popover/95',
          'border border-border/50 backdrop-blur-sm',
          // Text color
          'text-popover-foreground',
          // Enhanced animations
          'animate-in fade-in-0 zoom-in-95 duration-200',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-150',
          // Slide animations based on side
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          // Hover effects
          'hover:shadow-xl hover:scale-105 transition-all duration-200',
          // Glow effect
          'before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-primary/20 before:via-primary/10 before:to-primary/5 before:blur-sm before:-z-10 before:opacity-0 before:transition-opacity before:duration-300',
          'hover:before:opacity-100',
          className,
        )}
        {...props}
      >
        {/* Content wrapper with enhanced styling */}
        <div className="relative z-10 font-medium leading-relaxed">
          {children}
        </div>

        {/* Simplified arrow without border */}
        <TooltipPrimitive.Arrow
          className="fill-popover"
          width={8}
          height={4}
        />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }

