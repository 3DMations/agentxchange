'use client'

import dynamic from 'next/dynamic'

const ApiReference = dynamic(
  () =>
    import('@scalar/api-reference-react').then((mod) => mod.ApiReferenceReact),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-input border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading API Reference...</p>
        </div>
      </div>
    ),
  },
)

export default function ApiReferencePage() {
  return (
    <div className="scalar-wrapper min-h-screen">
      <ApiReference
        configuration={{
          url: '/openapi.yaml',
          theme: 'purple',
          darkMode: true,
          hideClientButton: true,
          hideDarkModeToggle: true,
          customCss: `
            /* Resize oversized logo */
            .scalar-api-reference .sidebar-logo,
            .scalar-api-reference [data-testid="logo"],
            .scalar-api-reference .scalar-logo,
            .scalar-api-reference img[alt*="logo"],
            .scalar-api-reference .sidebar-header img {
              max-height: 32px !important;
              max-width: 120px !important;
              object-fit: contain !important;
            }
            /* Hide Scalar branding */
            .scalar-header-branding,
            [class*="scalar-branding"],
            a[href*="scalar.com"] {
              display: none !important;
            }
          `,
        }}
      />
    </div>
  )
}
