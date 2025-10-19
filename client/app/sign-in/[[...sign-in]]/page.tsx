"use client"

import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Đăng nhập</h1>
          <p className="text-muted-foreground">Đăng nhập vào Website Builder</p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: 'bg-primary hover:bg-primary/90',
              card: 'bg-card border border-border shadow-lg',
              headerTitle: 'text-foreground',
              headerSubtitle: 'text-muted-foreground',
              socialButtonsBlockButton: 'border border-border hover:bg-accent',
              socialButtonsBlockButtonText: 'text-foreground',
              formFieldLabel: 'text-foreground',
              formFieldInput: 'bg-background border-border text-foreground',
              footerActionLink: 'text-primary hover:text-primary/90'
            }
          }}
          fallbackRedirectUrl="/"
          redirectUrl="/"
        />
      </div>
    </div>
  )
}