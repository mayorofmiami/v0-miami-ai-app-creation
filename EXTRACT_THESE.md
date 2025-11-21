# Files to Copy to New Project

## 🎨 MUST COPY (Visual Design)

### Design System
\`\`\`
app/globals.css                                    ← YOUR ENTIRE THEME
\`\`\`

### Landing Pages (Your Hero Design)
\`\`\`
components/landing/unauthenticated-landing.tsx     ← Video background landing
components/landing/authenticated-landing.tsx       ← Main app interface
components/landing-hero.tsx
\`\`\`

### Search Interface (Your Chat UI)
\`\`\`
components/search-page/conversation-view.tsx       ← Main chat design
components/search-page/search-sidebar.tsx          ← Sidebar layout
components/search-input.tsx                        ← Search bar design
components/search-results.tsx                      ← Results display
components/model-selector.tsx                      ← Model switcher
components/search-suggestions.tsx
components/streaming-search-result.tsx
\`\`\`

### UI Components (shadcn + Your Customizations)
\`\`\`
components/ui/                                     ← ALL OF THESE
\`\`\`

### Navigation
\`\`\`
components/collapsible-sidebar.tsx                 ← Your sidebar design
components/header.tsx
components/mobile-nav.tsx
\`\`\`

### Authentication UI
\`\`\`
app/login/page.tsx                                 ← Login form design
app/signup/page.tsx                                ← Signup form design
\`\`\`

### Admin Panel Design
\`\`\`
app/(admin)/admin/page.tsx                         ← Dashboard layout
components/admin/admin-chart.tsx
components/admin/admin-tabs.tsx
\`\`\`

### Other Visual Components
\`\`\`
components/bookmarks-panel.tsx
components/collections-panel.tsx
components/image-generation-form.tsx
components/error-boundary.tsx
components/loading-spinner.tsx
components/offline-indicator.tsx
\`\`\`

### Assets
\`\`\`
public/                                            ← ALL images, videos, assets
\`\`\`

## 🔧 UTILITIES (May Need Adjustment)
\`\`\`
lib/utils.ts                                       ← cn() helper
hooks/                                             ← Custom hooks
\`\`\`

## ❌ DON'T COPY (Rebuild These Clean)
\`\`\`
app/api/                                           ← Rebuild APIs
lib/db.ts                                          ← Rebuild database
lib/auth.ts                                        ← Rebuild auth logic
scripts/                                           ← New clean schema
middleware.ts                                      ← Rebuild clean
\`\`\`

## 📦 Next Steps

1. **Download this project as ZIP now**
2. **Create new v0 project**
3. **Tell me when ready, I'll help you:**
   - Copy these components over
   - Build clean database schema
   - Wire up new APIs to old visual components
   - Keep 100% of your visual design

**Ready to start the clean rebuild?**
