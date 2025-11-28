import type { BuilderElement } from "./builder-types"

export interface Template {
  id: string
  name: string
  description: string
  category: "hero" | "about" | "services" | "contact" | "footer" | "navigation" | "full-page"
  thumbnail: string
  elements: BuilderElement[]
  popular?: boolean
  tags?: string[]
}

export const templates: Template[] = [
  // Hero Sections
  {
    id: "hero-modern",
    name: "Modern Hero",
    description: "Clean hero section with CTA",
    category: "hero",
    thumbnail: "/placeholder.svg?height=120&width=200&text=Modern+Hero",
    popular: true,
    tags: ["modern", "clean", "cta"],
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

  // Additional Hero Templates
  {
    id: "hero-minimal",
    name: "Minimal Hero",
    description: "Ultra-clean minimal hero design",
    category: "hero",
    thumbnail: "/placeholder.svg?height=120&width=200&text=Minimal+Hero",
    popular: true,
    tags: ["minimal", "clean", "simple"],
    elements: [
      {
        id: "minimal-hero",
        type: "section",
        content: "",
        styles: {
          padding: "6rem 2rem",
          backgroundColor: "var(--color-background)",
          textAlign: "center",
          minHeight: "50vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        },
        children: [
          {
            id: "minimal-title",
            type: "heading",
            content: "Simplicity is the ultimate sophistication",
            styles: {
              fontSize: "3rem",
              fontWeight: "300",
              marginBottom: "2rem",
              color: "var(--color-foreground)",
              lineHeight: "1.2",
              letterSpacing: "-0.02em",
            },
            responsiveStyles: {
              desktop: { fontSize: "3rem" },
              tablet: { fontSize: "2.25rem" },
              mobile: { fontSize: "1.75rem" },
            },
          },
          {
            id: "minimal-subtitle",
            type: "paragraph",
            content: "Focus on what matters most",
            styles: {
              fontSize: "1.125rem",
              color: "var(--color-muted-foreground)",
              fontWeight: "400",
              letterSpacing: "0.01em",
            },
          },
        ],
      },
    ],
  },

  {
    id: "hero-dark",
    name: "Dark Hero",
    description: "Bold dark theme hero section",
    category: "hero",
    thumbnail: "/placeholder.svg?height=120&width=200&text=Dark+Hero",
    tags: ["dark", "bold", "modern"],
    elements: [
      {
        id: "dark-hero",
        type: "section",
        content: "",
        styles: {
          padding: "5rem 2rem",
          background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
          textAlign: "center",
          minHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
        },
        children: [
          {
            id: "dark-title",
            type: "heading",
            content: "Dark Mode Excellence",
            styles: {
              fontSize: "4.5rem",
              fontWeight: "700",
              marginBottom: "1.5rem",
              color: "white",
              textShadow: "0 4px 8px rgba(0,0,0,0.5)",
            },
            responsiveStyles: {
              desktop: { fontSize: "4.5rem" },
              tablet: { fontSize: "3.5rem" },
              mobile: { fontSize: "2.5rem" },
            },
          },
          {
            id: "dark-subtitle",
            type: "paragraph",
            content: "Experience the power of dark design",
            styles: {
              fontSize: "1.5rem",
              color: "rgba(255,255,255,0.8)",
              marginBottom: "3rem",
              fontWeight: "300",
            },
          },
          {
            id: "dark-cta",
            type: "button",
            content: "Explore Dark Mode",
            styles: {
              padding: "1.25rem 2.5rem",
              fontSize: "1.125rem",
              fontWeight: "600",
              backgroundColor: "white",
              color: "#1a1a1a",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
            },
          },
        ],
      },
    ],
  },

  // Additional About Templates
  {
    id: "about-team",
    name: "Team About",
    description: "About section featuring team members",
    category: "about",
    thumbnail: "/placeholder.svg?height=120&width=200&text=Team+About",
    popular: true,
    tags: ["team", "about", "people"],
    elements: [
      {
        id: "team-section",
        type: "section",
        content: "",
        styles: {
          padding: "5rem 2rem",
          backgroundColor: "var(--color-background)",
          textAlign: "center",
        },
        children: [
          {
            id: "team-title",
            type: "heading",
            content: "Meet Our Team",
            styles: {
              fontSize: "3rem",
              fontWeight: "bold",
              marginBottom: "1rem",
              color: "var(--color-foreground)",
            },
          },
          {
            id: "team-subtitle",
            type: "paragraph",
            content: "The talented individuals behind our success",
            styles: {
              fontSize: "1.25rem",
              color: "var(--color-muted-foreground)",
              marginBottom: "4rem",
              maxWidth: "600px",
              margin: "0 auto 4rem auto",
            },
          },
          {
            id: "team-grid",
            type: "grid",
            content: "",
            styles: {
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "3rem",
              maxWidth: "1000px",
              margin: "0 auto",
            },
            responsiveStyles: {
              desktop: { gridTemplateColumns: "repeat(3, 1fr)" },
              tablet: { gridTemplateColumns: "repeat(2, 1fr)" },
              mobile: { gridTemplateColumns: "1fr" },
            },
            children: [
              {
                id: "member-1",
                type: "card",
                content: "John Doe\nCEO & Founder",
                styles: {
                  padding: "2rem",
                  backgroundColor: "var(--color-card)",
                  borderRadius: "1rem",
                  border: "1px solid var(--color-border)",
                  textAlign: "center",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                },
              },
              {
                id: "member-2",
                type: "card",
                content: "Jane Smith\nLead Designer",
                styles: {
                  padding: "2rem",
                  backgroundColor: "var(--color-card)",
                  borderRadius: "1rem",
                  border: "1px solid var(--color-border)",
                  textAlign: "center",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                },
              },
              {
                id: "member-3",
                type: "card",
                content: "Mike Johnson\nLead Developer",
                styles: {
                  padding: "2rem",
                  backgroundColor: "var(--color-card)",
                  borderRadius: "1rem",
                  border: "1px solid var(--color-border)",
                  textAlign: "center",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                },
              },
            ],
          },
        ],
      },
    ],
  },

  // Additional Services Templates
  {
    id: "services-features",
    name: "Feature Services",
    description: "Services with feature highlights",
    category: "services",
    thumbnail: "/placeholder.svg?height=120&width=200&text=Feature+Services",
    tags: ["features", "services", "highlights"],
    elements: [
      {
        id: "features-section",
        type: "section",
        content: "",
        styles: {
          padding: "5rem 2rem",
          backgroundColor: "var(--color-muted)",
        },
        children: [
          {
            id: "features-title",
            type: "heading",
            content: "Why Choose Us",
            styles: {
              fontSize: "3rem",
              fontWeight: "bold",
              marginBottom: "3rem",
              color: "var(--color-foreground)",
              textAlign: "center",
            },
          },
          {
            id: "features-list",
            type: "list",
            content: "✓ Fast & Reliable\n✓ 24/7 Support\n✓ Modern Technology\n✓ Affordable Pricing",
            styles: {
              maxWidth: "600px",
              margin: "0 auto",
              backgroundColor: "var(--color-card)",
              padding: "3rem",
              borderRadius: "1rem",
              border: "1px solid var(--color-border)",
              fontSize: "1.125rem",
              lineHeight: "2",
              color: "var(--color-foreground)",
            },
          },
        ],
      },
    ],
  },

  // Full Page Templates
  {
    id: "landing-page",
    name: "Complete Landing Page",
    description: "Full landing page with all sections",
    category: "full-page",
    thumbnail: "/placeholder.svg?height=120&width=200&text=Landing+Page",
    popular: true,
    tags: ["landing", "complete", "full-page"],
    elements: [
      {
        id: "landing-hero",
        type: "section",
        content: "",
        styles: {
          padding: "6rem 2rem",
          background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-chart-1) 100%)",
          textAlign: "center",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
        },
        children: [
          {
            id: "landing-title",
            type: "heading",
            content: "Transform Your Business",
            styles: {
              fontSize: "4rem",
              fontWeight: "bold",
              marginBottom: "1.5rem",
              color: "white",
              textShadow: "0 2px 4px rgba(0,0,0,0.3)",
            },
          },
          {
            id: "landing-subtitle",
            type: "paragraph",
            content: "The complete solution for modern businesses",
            styles: {
              fontSize: "1.5rem",
              color: "rgba(255,255,255,0.9)",
              marginBottom: "3rem",
              maxWidth: "700px",
            },
          },
          {
            id: "landing-cta",
            type: "button",
            content: "Get Started Today",
            styles: {
              padding: "1.25rem 3rem",
              fontSize: "1.25rem",
              fontWeight: "600",
              backgroundColor: "white",
              color: "var(--color-primary)",
              border: "none",
              borderRadius: "0.75rem",
              cursor: "pointer",
              boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
            },
          },
        ],
      },
    ],
  },

  {
    id: "portfolio-page",
    name: "Portfolio Page",
    description: "Complete portfolio showcase page",
    category: "full-page",
    thumbnail: "/placeholder.svg?height=120&width=200&text=Portfolio+Page",
    tags: ["portfolio", "showcase", "creative"],
    elements: [
      {
        id: "portfolio-hero",
        type: "section",
        content: "",
        styles: {
          padding: "4rem 2rem",
          backgroundColor: "var(--color-background)",
          textAlign: "center",
        },
        children: [
          {
            id: "portfolio-title",
            type: "heading",
            content: "Creative Portfolio",
            styles: {
              fontSize: "3.5rem",
              fontWeight: "bold",
              marginBottom: "1rem",
              color: "var(--color-foreground)",
            },
          },
          {
            id: "portfolio-subtitle",
            type: "paragraph",
            content: "Showcasing innovative design and development",
            styles: {
              fontSize: "1.25rem",
              color: "var(--color-muted-foreground)",
              marginBottom: "3rem",
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

export const getPopularTemplates = () => {
  return templates.filter((template) => template.popular)
}

export const searchTemplates = (query: string) => {
  const lowercaseQuery = query.toLowerCase()
  return templates.filter((template) =>
    template.name.toLowerCase().includes(lowercaseQuery) ||
    template.description.toLowerCase().includes(lowercaseQuery) ||
    template.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  )
}
