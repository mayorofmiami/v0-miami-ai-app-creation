# Miami.ai Component Library
Complete reusable component catalog for future projects

## 🎨 UI Components

### Landing Pages
- **UnauthenticatedLanding** (`components/landing/unauthenticated-landing.tsx`)
  - Video background support
  - Hero section with CTA
  - Example queries
  - Free search functionality
  
- **AuthenticatedLanding** (`components/landing/authenticated-landing.tsx`)
  - Main app dashboard
  - Search interface
  - History sidebar integration
  
- **SearchContainer** (`components/landing/search-container.tsx`)
  - Unified search wrapper component

### Search Components
- **SearchInput** (`components/search-input.tsx`)
  - Advanced search bar with attachments
  - Voice input support
  - Suggestions dropdown
  
- **AttachmentList** (`components/search-input/attachment-list.tsx`)
  - File upload preview
  - Drag and drop support
  
- **SearchInputMenu** (`components/search-input/search-input-menu.tsx`)
  - Context menu for search options
  
- **SearchSuggestions** (`components/search-input/search-suggestions.tsx`)
  - AI-powered query suggestions
  
- **SearchResponse** (`components/search-response.tsx`)
  - Formatted AI response display
  - Markdown rendering
  - Code highlighting
  
- **SearchActions** (`components/search-actions.tsx`)
  - Copy, share, bookmark actions
  
- **ResponseActions** (`components/response-actions.tsx`)
  - Individual response action buttons
  
- **ConversationView** (`components/search-page/conversation-view.tsx`)
  - Chat-style conversation interface
  
- **SearchFormContainer** (`components/search-page/search-form-container.tsx`)
  - Form wrapper with state management

### Model Selection
- **ModelSelector** (`components/model-selector.tsx`)
  - AI model picker dropdown
  - Model info display
  
- **ModelBadge** (`components/model-badge.tsx`)
  - Visual model identifier

### Collections & Bookmarks
- **BookmarksSidebar** (`components/bookmarks-sidebar.tsx`)
  - Saved searches sidebar
  - Organization by collections
  
- **CollectionsModal** (`components/collections-modal.tsx`)
  - Collection management dialog
  - Create/edit/delete collections

### Navigation
- **CollapsibleSidebar** (`components/collapsible-sidebar.tsx`)
  - Responsive sidebar with collapsible sections
  - Navigation links
  - User menu
  
- **HistorySidebar** (`components/history-sidebar.tsx`)
  - Search history with filtering
  - Date organization
  
- **MobileDrawer** (`components/mobile-drawer.tsx`)
  - Mobile-optimized navigation drawer

### Authentication
- **AuthPromptDialog** (`components/auth-prompt-dialog.tsx`)
  - Sign up/in prompt for free users
  
- **LogoutButton** (`components/logout-button.tsx`)
  - Logout with confirmation

### Admin
- **AdminLayoutClient** (`components/admin-layout-client.tsx`)
  - Admin panel wrapper
  
- **AdminChart** (`components/admin-chart.tsx`)
  - Analytics visualization
  
- **RateLimitManager** (`components/admin/rate-limit-manager.tsx`)
  - Rate limit configuration UI
  
- **StatCard** (`components/stat-card.tsx`)
  - Dashboard stat display

### Blog/Content
- **NovelEditor** (`components/blog/novel-editor.tsx`)
  - Rich text editor (Novel.sh integration)
  
- **RichTextEditor** (`components/blog/rich-text-editor.tsx`)
  - Alternative rich text editor

### UI Elements
- **Logo** (`components/logo.tsx`)
  - Miami.ai branding logo
  
- **MiamiLoader** (`components/miami-loader.tsx`)
  - Branded loading animation
  
- **EmptyState** (`components/empty-state.tsx`)
  - Empty state placeholder
  
- **SkeletonSearch** (`components/skeleton-search.tsx`)
  - Loading skeleton for search
  
- **ExampleQueries** (`components/example-queries.tsx`)
  - Pre-filled query suggestions
  
- **RelatedSearches** (`components/related-searches.tsx`)
  - Related query suggestions
  
- **PageHeader** (`components/page-header.tsx`)
  - Consistent page headers
  
- **FancyGlowingButton** (`components/fancy-glowing-button.tsx`)
  - Animated glow button effect
  
- **FloatingActionMenu** (`components/floating-action-menu.tsx`)
  - Floating action button menu
  
- **PricingCard** (`components/pricing-card.tsx`)
  - Subscription pricing display
  
- **SignupBenefitsCard** (`components/signup-benefits-card.tsx`)
  - Feature benefits list
  
- **ImageResult** (`components/image-result.tsx`)
  - Image generation result display

### Help & Info
- **HelpMenu** (`components/help-menu.tsx`)
  - Help menu dropdown
  
- **AboutDialog** (`components/help/about-dialog.tsx`)
  - About page modal
  
- **PrivacyDialog** (`components/help/privacy-dialog.tsx`)
  - Privacy policy modal
  
- **TermsDialog** (`components/help/terms-dialog.tsx`)
  - Terms of service modal

### Utilities
- **KeyboardShortcuts** (`components/keyboard-shortcuts.tsx`)
  - Keyboard shortcut handler
  
- **OfflineIndicator** (`components/offline-indicator.tsx`)
  - Network status indicator
  
- **OnboardingModal** (`components/onboarding-modal.tsx`)
  - First-time user onboarding
  
- **ShareModal** (`components/share-modal.tsx`)
  - Share search results modal
  
- **ThemeToggle** (`components/theme-toggle.tsx`)
  - Dark/light mode toggle
  
- **ThemeProvider** (`components/theme-provider.tsx`)
  - Theme context provider
  
- **PrefetchProvider** (`components/prefetch-provider.tsx`)
  - Data prefetching context

### Error Handling
- **ErrorBoundary** (`components/error-boundary.tsx`)
  - Root error boundary
  
- **ComponentErrorBoundary** (`components/error-boundaries/component-error-boundary.tsx`)
  - Component-level error boundary
  
- **RouteErrorBoundary** (`components/error-boundaries/route-error-boundary.tsx`)
  - Route-level error boundary
  
- **SearchErrorBoundary** (`components/error-boundaries/search-error-boundary.tsx`)
  - Search-specific error handling

---

## 🎯 Custom Hooks

### Data Fetching
- **useAiStream** (`hooks/use-ai-stream.ts`)
  - Streaming AI response hook
  
- **useSearchCache** (`hooks/use-search-cache.ts`)
  - Search result caching
  
- **useRateLimit** (`hooks/use-rate-limit.ts`)
  - Rate limit checking

### UI State
- **useAttachments** (`hooks/use-attachments.ts`)
  - File attachment management
  
- **useLoading** (`hooks/use-loading.ts`)
  - Loading state management
  
- **useKeyboardShortcuts** (`hooks/use-keyboard-shortcuts.ts`)
  - Keyboard shortcut registration
  
- **useMobile** (`hooks/use-mobile.ts`)
  - Mobile device detection
  
- **useToast** (`hooks/use-toast.ts`)
  - Toast notification system

### Authentication
- **useAuthenticatedUser** (`hooks/use-authenticated-user.ts`)
  - Current user context

---

## 🛠️ Utilities & Helpers

### API & Networking
- **api-client** (`lib/api-client.ts`)
  - Unified API request handler
  
- **firecrawl** (`lib/firecrawl.ts`)
  - Web scraping utility
  
- **web-search** (`lib/web-search.ts`)
  - Web search integration
  
- **request-deduplicator** (`lib/request-deduplicator.ts`)
  - Prevent duplicate requests

### Database
- **db** (`lib/db.tsx`)
  - Database connection singleton
  
- **db-init** (`lib/db-init.ts`)
  - Database initialization
  
- **bookmarks** (`lib/bookmarks.ts`)
  - Bookmark operations
  
- **collections** (`lib/collections.ts`)
  - Collection management

### Authentication & Security
- **auth** (`lib/auth.ts`)
  - Authentication helpers
  - Password hashing
  - Session management
  
- **oauth** (`lib/oauth.ts`)
  - OAuth provider integration
  
- **unified-rate-limit** (`lib/unified-rate-limit.ts`)
  - Rate limiting logic
  
- **validation** (`lib/validation.ts`)
  - Input validation schemas

### State Management
- **search-reducer** (`lib/reducers/search-reducer.tsx`)
  - Search state reducer
  
- **local-storage** (`lib/local-storage.ts`)
  - LocalStorage wrapper
  
- **cache** (`lib/cache.ts`)
  - In-memory caching

### AI & Content
- **query-analyzer** (`lib/query-analyzer.ts`)
  - Query intent analysis
  
- **search-suggestions** (`lib/search-suggestions.ts`)
  - AI-powered suggestions
  
- **model-selection** (`lib/model-selection.ts`)
  - Model selection logic
  
- **tools** (`lib/tools.ts`)
  - AI tool definitions
  
- **cost-tracker** (`lib/cost-tracker.ts`)
  - API cost tracking

### Integrations
- **redis** (`lib/redis.ts`)
  - Redis caching
  
- **polar** (`lib/polar.ts`)
  - Polar subscription integration
  
- **products** (`lib/products.ts`)
  - Product/pricing configuration

### UI Utilities
- **utils** (`lib/utils.ts`)
  - General utilities
  - cn() for className merging
  
- **toast** (`lib/toast.ts`)
  - Toast notification helpers
  
- **throttle** (`lib/throttle.ts`)
  - Function throttling
  
- **export** (`lib/export.ts`)
  - Data export utilities
  
- **share** (`lib/share.tsx`)
  - Share functionality

### Error Handling & Logging
- **error-handling** (`lib/error-handling.ts`)
  - Error handling utilities
  
- **logger** (`lib/logger.ts`)
  - Client-side logging
  
- **admin-logger** (`lib/admin-logger.ts`)
  - Admin activity logging

### Offline Support
- **offline-handler** (`lib/offline-handler.ts`)
  - Offline functionality
  
- **prefetch** (`lib/prefetch.ts`)
  - Data prefetching

### Types & Constants
- **types** (`lib/types.ts`)
  - TypeScript type definitions
  
- **constants** (`lib/constants.ts`)
  - App constants
  
- **content-type-change** (`lib/content-type-change.ts`)
  - Content type utilities

---

## 🎨 Icon System

All icons in `components/icons/` (100+ custom SVG icons):
- Alert, Arrows, Bell, Bold, Bookmark, Brain
- Calendar, Check, Chevrons, Circle, Clock, Code
- Copy, Database, Dollar, Download, Edit, Eye
- Feather, File, Flame, Folder, Grip, Hammer
- Heading, Help, History, Home, Image, Info
- Italic, List, Loader, Logout, Menu, Mic
- Minus, Moon, More, Palette, Palmtree, Panel
- Paperclip, Plus, Quote, Redo/Undo, Refresh
- Rotate, Save, Search, Settings, Share, Shield
- Sparkles, Sun, Trash, Trending, User, Wifi
- X, Zap, and more...

---

## 📦 shadcn/ui Components

Full set of shadcn/ui primitives in `components/ui/`:
- Accordion, Alert Dialog, Alert, Aspect Ratio
- Avatar, Badge, Breadcrumb, Button Group, Button
- Calendar, Card, Carousel, Chart, Checkbox
- Collapsible, Command, Context Menu, Dialog
- Drawer, Dropdown Menu, Empty, Field, Form
- Hover Card, Input Group, Input OTP, Input, Item
- Kbd, Label, Menubar, Navigation Menu, Pagination
- Popover, Progress, Radio Group, Resizable
- Scroll Area, Select, Separator, Sheet, Sidebar
- Skeleton, Slider, Sonner, Spinner, Switch
- Table, Tabs, Textarea, Toast, Toaster
- Toggle Group, Toggle, Tooltip

---

## 🎯 How to Use This Library

### Option 1: Copy Individual Components
\`\`\`bash
# Copy a specific component
cp components/search-input.tsx ../new-project/components/

# Copy related utilities
cp lib/api-client.ts ../new-project/lib/
\`\`\`

### Option 2: Copy Entire Folders
\`\`\`bash
# Copy all icons
cp -r components/icons/ ../new-project/components/

# Copy all hooks
cp -r hooks/ ../new-project/

# Copy UI library
cp -r components/ui/ ../new-project/components/
\`\`\`

### Option 3: Use as Git Submodule
\`\`\`bash
# Add as submodule in new project
git submodule add <repo-url> lib/miami-components

# Import from submodule
import { SearchInput } from '@/lib/miami-components/components/search-input'
\`\`\`

### Option 4: Package as NPM Module
Create a `package.json` in a components folder and publish:
\`\`\`json
{
  "name": "@miami/components",
  "version": "1.0.0",
  "main": "index.ts",
  "exports": {
    "./search": "./components/search-input.tsx",
    "./landing": "./components/landing/unauthenticated-landing.tsx"
  }
}
\`\`\`

---

## 🎨 Design System

### Colors (from globals.css)
- Primary: Cyan/Aqua (#00d4ff, #0ff)
- Secondary: Pink/Magenta (#ff006e, #f0f)
- Background: Dark (#0a0a0a)
- Accent: Miami Vice gradient

### Typography
- Font Family: Inter (from globals.css)
- Heading scales with responsive sizing
- Body text with proper line-height

### Spacing
- Consistent 4px grid system
- Mobile-first responsive breakpoints

---

## 📋 Dependencies

Core dependencies used across components:
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Radix UI primitives
- Framer Motion (animations)
- Lucide React (icon fallbacks)
- React Hook Form
- Zod (validation)

---

## 💡 Best Practices

1. **Always copy dependencies**: When copying a component, check its imports and copy related utilities/hooks
2. **Update paths**: Adjust import paths based on your new project structure
3. **Check environment variables**: Components may expect specific env vars
4. **Database schema**: If using DB components, ensure you have matching tables
5. **Theme compatibility**: Components use CSS variables from globals.css
6. **TypeScript types**: Copy type definitions from lib/types.ts

---

## 🚀 Quick Start Templates

### Minimal Search App
\`\`\`
Copy:
- components/search-input.tsx
- components/search-response.tsx
- components/model-selector.tsx
- lib/api-client.ts
- hooks/use-ai-stream.ts
\`\`\`

### Full Landing Page
\`\`\`
Copy:
- components/landing/unauthenticated-landing.tsx
- components/example-queries.tsx
- components/logo.tsx
- components/fancy-glowing-button.tsx
\`\`\`

### Admin Dashboard
\`\`\`
Copy:
- components/admin-layout-client.tsx
- components/admin-chart.tsx
- components/stat-card.tsx
- components/admin/rate-limit-manager.tsx
\`\`\`

### Complete Auth System
\`\`\`
Copy:
- lib/auth.ts
- lib/oauth.ts
- lib/validation.ts
- components/auth-prompt-dialog.tsx
- hooks/use-authenticated-user.ts
\`\`\`

---

**Last Updated**: January 2025
**Project**: Miami.ai
**License**: Proprietary (Copy for your own use)
