"use client"

import { SignIn, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SignInPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    const checkAdminAndRedirect = async () => {
      if (isLoaded && user?.id) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/users/status/${user.id}`)
          if (response.ok) {
            const data = await response.json()
            if (data.role === "admin") {
              router.push("/admin")
            } else {
              router.push("/")
            }
          } else {
            router.push("/")
          }
        } catch (error) {
          console.error("Failed to check admin status:", error)
          router.push("/")
        }
      }
    }

    checkAdminAndRedirect()
  }, [isLoaded, user?.id, router])

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
          forceRedirectUrl="/"
        />
      </div>
    </div>
  )
}