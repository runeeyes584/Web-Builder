import type { BuilderElement } from "./builder-types"

export interface Template {
  id: string
  name: string
  description: string
  category: "hero" | "about" | "services" | "contact" | "footer" | "navigation" | "full-page"
  thumbnail: string
  elements: BuilderElement[]
}

export const templates: Template[] = [
  // Hero Sections
  {
    id: "hero-modern",
    name: "Modern Hero",
    description: "Clean hero section with CTA",
    category: "hero",
    thumbnail: "/placeholder.svg?height=120&width=200&text=Modern+Hero",
    elements: [
      {
        id: "hero-section",
        type: "section",
        content: "",
        styles: {
          padding: "4rem 2rem",
          backgroundColor: "var(--color-background)",
          textAlign: "center",
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        },
        responsiveStyles: {
          desktop: { padding: "4rem 2rem" },
          tablet: { padding: "3rem 1.5rem" },
          mobile: { padding: "2rem 1rem" },
        },
        children: [
          {
            id: "hero-title",
            type: "heading",
            content: "Build Amazing Websites",
            styles: {
              fontSize: "3.5rem",
              fontWeight: "bold",
              marginBottom: "1.5rem",
              color: "var(--color-foreground)",
              lineHeight: "1.1",
            },
            responsiveStyles: {
              desktop: { fontSize: "3.5rem" },
              tablet: { fontSize: "2.5rem" },
              mobile: { fontSize: "2rem" },
            },
          },
          {
            id: "hero-subtitle",
            type: "paragraph",
            content: "Create stunning, responsive websites with our drag-and-drop builder. No coding required.",
            styles: {
              fontSize: "1.25rem",
              color: "var(--color-muted-foreground)",
              marginBottom: "2rem",
              maxWidth: "600px",
              lineHeight: "1.6",
            },
            responsiveStyles: {
              desktop: { fontSize: "1.25rem" },
              tablet: { fontSize: "1.1rem" },
              mobile: { fontSize: "1rem" },
            },
          },
          {
            id: "hero-cta",
            type: "button",
            content: "Get Started Free",
            styles: {
              padding: "1rem 2rem",
              fontSize: "1.1rem",
              fontWeight: "600",
              backgroundColor: "var(--color-primary)",
              color: "var(--color-primary-foreground)",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              transition: "all 0.2s",
            },
            responsiveStyles: {
              desktop: { padding: "1rem 2rem", fontSize: "1.1rem" },
              tablet: { padding: "0.875rem 1.75rem", fontSize: "1rem" },
              mobile: { padding: "0.75rem 1.5rem", fontSize: "0.95rem" },
            },
            props: { href: "#" },
          },
        ],
      },
    ],
  },
  {
    id: "hero-gradient",
    name: "Gradient Hero",
    description: "Hero with gradient background",
    category: "hero",
    thumbnail: "/placeholder.svg?height=120&width=200&text=Gradient+Hero",
    elements: [
      {
        id: "gradient-hero",
        type: "section",
        content: "",
        styles: {
          padding: "5rem 2rem",
          background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-chart-1) 100%)",
          textAlign: "center",
          minHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        },
        children: [
          {
            id: "gradient-title",
            type: "heading",
            content: "Welcome to the Future",
            styles: {
              fontSize: "4rem",
              fontWeight: "bold",
              marginBottom: "1.5rem",
              color: "white",
              textShadow: "0 2px 4px rgba(0,0,0,0.3)",
            },
            responsiveStyles: {
              desktop: { fontSize: "4rem" },
              tablet: { fontSize: "3rem" },
              mobile: { fontSize: "2.25rem" },
            },
          },
          {
            id: "gradient-subtitle",
            type: "paragraph",
            content: "Experience innovation like never before with our cutting-edge solutions.",
            styles: {
              fontSize: "1.5rem",
              color: "rgba(255,255,255,0.9)",
              marginBottom: "2.5rem",
              maxWidth: "700px",
            },
            responsiveStyles: {
              desktop: { fontSize: "1.5rem" },
              tablet: { fontSize: "1.25rem" },
              mobile: { fontSize: "1.1rem" },
            },
          },
        ],
      },
    ],
  },

  // About Sections
  {
    id: "about-simple",
    name: "Simple About",
    description: "Clean about section with image",
    category: "about",
    thumbnail: "/placeholder.svg?height=120&width=200&text=About+Section",
    elements: [
      {
        id: "about-section",
        type: "section",
        content: "",
        styles: {
          padding: "4rem 2rem",
          backgroundColor: "var(--color-muted)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "3rem",
          alignItems: "center",
        },
        responsiveStyles: {
          desktop: { gridTemplateColumns: "1fr 1fr", gap: "3rem" },
          tablet: { gridTemplateColumns: "1fr", gap: "2rem" },
          mobile: { gridTemplateColumns: "1fr", gap: "1.5rem", padding: "2rem 1rem" },
        },
        children: [
          {
            id: "about-content",
            type: "section",
            content: "",
            styles: {},
            children: [
              {
                id: "about-title",
                type: "heading",
                content: "About Our Company",
                styles: {
                  fontSize: "2.5rem",
                  fontWeight: "bold",
                  marginBottom: "1.5rem",
                  color: "var(--color-foreground)",
                },
                responsiveStyles: {
                  desktop: { fontSize: "2.5rem" },
                  tablet: { fontSize: "2rem" },
                  mobile: { fontSize: "1.75rem" },
                },
              },
              {
                id: "about-text",
                type: "paragraph",
                content:
                  "We are passionate about creating innovative solutions that help businesses thrive in the digital age. Our team of experts combines creativity with technical excellence to deliver outstanding results.",
                styles: {
                  fontSize: "1.1rem",
                  lineHeight: "1.7",
                  color: "var(--color-muted-foreground)",
                  marginBottom: "2rem",
                },
              },
            ],
          },
          {
            id: "about-image",
            type: "image",
            content: "/placeholder.svg?height=400&width=500&text=About+Image",
            styles: {
              width: "100%",
              height: "auto",
              borderRadius: "0.75rem",
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            },
            props: { alt: "About us" },
          },
        ],
      },
    ],
  },

  // Services Section
  {
    id: "services-grid",
    name: "Services Grid",
    description: "3-column services layout",
    category: "services",
    thumbnail: "/placeholder.svg?height=120&width=200&text=Services+Grid",
    elements: [
      {
        id: "services-section",
        type: "section",
        content: "",
        styles: {
          padding: "4rem 2rem",
          backgroundColor: "var(--color-background)",
          textAlign: "center",
        },
        children: [
          {
            id: "services-title",
            type: "heading",
            content: "Our Services",
            styles: {
              fontSize: "2.5rem",
              fontWeight: "bold",
              marginBottom: "3rem",
              color: "var(--color-foreground)",
            },
          },
          {
            id: "services-grid",
            type: "grid",
            content: "",
            styles: {
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "2rem",
              maxWidth: "1200px",
              margin: "0 auto",
            },
            responsiveStyles: {
              desktop: { gridTemplateColumns: "repeat(3, 1fr)" },
              tablet: { gridTemplateColumns: "repeat(2, 1fr)" },
              mobile: { gridTemplateColumns: "1fr" },
            },
            children: [
              {
                id: "service-1",
                type: "section",
                content: "",
                styles: {
                  padding: "2rem",
                  backgroundColor: "var(--color-card)",
                  borderRadius: "0.75rem",
                  border: "1px solid var(--color-border)",
                  textAlign: "center",
                },
                children: [
                  {
                    id: "service-1-title",
                    type: "heading",
                    content: "Web Design",
                    styles: {
                      fontSize: "1.5rem",
                      fontWeight: "600",
                      marginBottom: "1rem",
                      color: "var(--color-foreground)",
                    },
                  },
                  {
                    id: "service-1-desc",
                    type: "paragraph",
                    content: "Beautiful, responsive websites that engage your audience and drive results.",
                    styles: {
                      color: "var(--color-muted-foreground)",
                      lineHeight: "1.6",
                    },
                  },
                ],
              },
              {
                id: "service-2",
                type: "section",
                content: "",
                styles: {
                  padding: "2rem",
                  backgroundColor: "var(--color-card)",
                  borderRadius: "0.75rem",
                  border: "1px solid var(--color-border)",
                  textAlign: "center",
                },
                children: [
                  {
                    id: "service-2-title",
                    type: "heading",
                    content: "Development",
                    styles: {
                      fontSize: "1.5rem",
                      fontWeight: "600",
                      marginBottom: "1rem",
                      color: "var(--color-foreground)",
                    },
                  },
                  {
                    id: "service-2-desc",
                    type: "paragraph",
                    content: "Custom web applications built with modern technologies and best practices.",
                    styles: {
                      color: "var(--color-muted-foreground)",
                      lineHeight: "1.6",
                    },
                  },
                ],
              },
              {
                id: "service-3",
                type: "section",
                content: "",
                styles: {
                  padding: "2rem",
                  backgroundColor: "var(--color-card)",
                  borderRadius: "0.75rem",
                  border: "1px solid var(--color-border)",
                  textAlign: "center",
                },
                children: [
                  {
                    id: "service-3-title",
                    type: "heading",
                    content: "SEO",
                    styles: {
                      fontSize: "1.5rem",
                      fontWeight: "600",
                      marginBottom: "1rem",
                      color: "var(--color-foreground)",
                    },
                  },
                  {
                    id: "service-3-desc",
                    type: "paragraph",
                    content: "Optimize your website to rank higher in search results and attract more visitors.",
                    styles: {
                      color: "var(--color-muted-foreground)",
                      lineHeight: "1.6",
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },

  // Contact Section
  {
    id: "contact-form",
    name: "Contact Form",
    description: "Contact section with form",
    category: "contact",
    thumbnail: "/placeholder.svg?height=120&width=200&text=Contact+Form",
    elements: [
      {
        id: "contact-section",
        type: "section",
        content: "",
        styles: {
          padding: "4rem 2rem",
          backgroundColor: "var(--color-muted)",
          textAlign: "center",
        },
        children: [
          {
            id: "contact-title",
            type: "heading",
            content: "Get In Touch",
            styles: {
              fontSize: "2.5rem",
              fontWeight: "bold",
              marginBottom: "1rem",
              color: "var(--color-foreground)",
            },
          },
          {
            id: "contact-subtitle",
            type: "paragraph",
            content: "Ready to start your project? Contact us today for a free consultation.",
            styles: {
              fontSize: "1.1rem",
              color: "var(--color-muted-foreground)",
              marginBottom: "3rem",
              maxWidth: "600px",
              margin: "0 auto 3rem auto",
            },
          },
          {
            id: "contact-form",
            type: "form",
            content: "Contact Form",
            styles: {
              maxWidth: "500px",
              margin: "0 auto",
              padding: "2rem",
              backgroundColor: "var(--color-card)",
              borderRadius: "0.75rem",
              border: "1px solid var(--color-border)",
            },
          },
        ],
      },
    ],
  },

  // Footer
  {
    id: "footer-simple",
    name: "Simple Footer",
    description: "Clean footer with links",
    category: "footer",
    thumbnail: "/placeholder.svg?height=120&width=200&text=Simple+Footer",
    elements: [
      {
        id: "footer-section",
        type: "footer",
        content: "",
        styles: {
          padding: "3rem 2rem 2rem 2rem",
          backgroundColor: "var(--color-secondary)",
          borderTop: "1px solid var(--color-border)",
          textAlign: "center",
        },
        children: [
          {
            id: "footer-content",
            type: "section",
            content: "",
            styles: {
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "2rem",
              maxWidth: "1200px",
              margin: "0 auto 2rem auto",
            },
            responsiveStyles: {
              desktop: { gridTemplateColumns: "repeat(3, 1fr)" },
              tablet: { gridTemplateColumns: "repeat(2, 1fr)" },
              mobile: { gridTemplateColumns: "1fr" },
            },
            children: [
              {
                id: "footer-brand",
                type: "section",
                content: "",
                styles: { textAlign: "left" },
                responsiveStyles: {
                  mobile: { textAlign: "center" },
                },
                children: [
                  {
                    id: "footer-logo",
                    type: "heading",
                    content: "Your Brand",
                    styles: {
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      marginBottom: "1rem",
                      color: "var(--color-foreground)",
                    },
                  },
                  {
                    id: "footer-desc",
                    type: "paragraph",
                    content: "Building amazing digital experiences for businesses worldwide.",
                    styles: {
                      color: "var(--color-muted-foreground)",
                      lineHeight: "1.6",
                    },
                  },
                ],
              },
              {
                id: "footer-links",
                type: "section",
                content: "",
                styles: { textAlign: "left" },
                responsiveStyles: {
                  mobile: { textAlign: "center" },
                },
                children: [
                  {
                    id: "footer-links-title",
                    type: "heading",
                    content: "Quick Links",
                    styles: {
                      fontSize: "1.25rem",
                      fontWeight: "600",
                      marginBottom: "1rem",
                      color: "var(--color-foreground)",
                    },
                  },
                  {
                    id: "footer-nav",
                    type: "navigation",
                    content: "Home • About • Services • Contact",
                    styles: {
                      color: "var(--color-muted-foreground)",
                      lineHeight: "2",
                    },
                  },
                ],
              },
              {
                id: "footer-contact",
                type: "section",
                content: "",
                styles: { textAlign: "left" },
                responsiveStyles: {
                  mobile: { textAlign: "center" },
                },
                children: [
                  {
                    id: "footer-contact-title",
                    type: "heading",
                    content: "Contact Info",
                    styles: {
                      fontSize: "1.25rem",
                      fontWeight: "600",
                      marginBottom: "1rem",
                      color: "var(--color-foreground)",
                    },
                  },
                  {
                    id: "footer-contact-info",
                    type: "paragraph",
                    content: "hello@yoursite.com\n+1 (555) 123-4567",
                    styles: {
                      color: "var(--color-muted-foreground)",
                      lineHeight: "2",
                      whiteSpace: "pre-line",
                    },
                  },
                ],
              },
            ],
          },
          {
            id: "footer-bottom",
            type: "paragraph",
            content: "© 2024 Your Brand. All rights reserved.",
            styles: {
              paddingTop: "2rem",
              borderTop: "1px solid var(--color-border)",
              color: "var(--color-muted-foreground)",
              fontSize: "0.9rem",
            },
          },
        ],
      },
    ],
  },
]

export const getTemplatesByCategory = (category: Template["category"]) => {
  return templates.filter((template) => template.category === category)
}

export const getAllTemplates = () => templates
