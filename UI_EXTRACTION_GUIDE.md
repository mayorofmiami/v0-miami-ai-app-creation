# Miami.ai UI/UX Extraction Package
Complete guide to recreate the exact visual design in a new project.

## 🎨 Step 1: Design System (Copy First)

### `app/globals.css`
**Your entire theme and styling** - Copy this file FIRST to get all colors, fonts, and design tokens.

### Fonts Used
- **Geist Sans** (primary)
- **Geist Mono** (code/monospace)

---

## 📦 Step 2: Core Visual Components (Priority Order)

### 🏠 Landing Page Components
Copy in this exact order:

1. **`components/landing/unauthenticated-landing.tsx`** - Main landing page
2. **`components/landing/authenticated-landing.tsx`** - Logged-in homepage
3. **`components/landing/search-container.tsx`** - Search interface wrapper
4. **`components/hero-section.tsx`** - Hero section with video
5. **`components/animated-hero-background.tsx`** - Background animations
6. **`components/background-video.tsx`** - Video background player

### 🔍 Search & Chat Interface
Main conversational UI:

7. **`components/search-input.tsx`** - Search bar with all features
8. **`components/search-results.tsx`** - Response display
9. **`components/search-page/conversation-view.tsx`** - Full chat interface
10. **`components/search-page/message-item.tsx`** - Individual messages
11. **`components/message-actions.tsx`** - Copy, regenerate buttons
12. **`components/example-queries.tsx`** - Example prompts
13. **`components/thinking-animation.tsx`** - Loading states

### 🎛️ Controls & Inputs
All interactive elements:

14. **`components/model-selector.tsx`** - AI model picker
15. **`components/model-display.tsx`** - Current model display
16. **`components/mode-selector.tsx`** - Search/Image toggle
17. **`components/mode-toggle.tsx`** - Mode switching UI
18. **`components/file-upload-button.tsx`** - Attachment uploads
19. **`components/image-preview.tsx`** - Image display
20. **`components/expandable-search.tsx`** - Expandable search bar

### 🎨 Branding & Buttons
Visual identity:

21. **`components/logo.tsx`** - Miami.ai logo
22. **`components/fancy-glowing-button.tsx`** - Glowing CTA button
23. **`components/signup-benefits-card.tsx`** - Benefits cards
24. **`components/feature-card.tsx`** - Feature displays
25. **`components/trust-indicators.tsx`** - Social proof

### 🧭 Navigation
All navigation elements:

26. **`components/page-header.tsx`** - Top header bar
27. **`components/collapsible-sidebar.tsx`** - Sidebar navigation
28. **`components/sidebar.tsx`** - Main sidebar
29. **`components/sidebar-content.tsx`** - Sidebar contents
30. **`components/thread-sidebar.tsx`** - Thread history
31. **`components/thread-list.tsx`** - Thread list view
32. **`components/mobile-nav.tsx`** - Mobile navigation

### 💾 Collections & Bookmarks
Organization features:

33. **`components/collections-panel.tsx`** - Collections sidebar
34. **`components/collection-card.tsx`** - Collection display
35. **`components/bookmark-button.tsx`** - Bookmark toggle
36. **`components/bookmarks-panel.tsx`** - Bookmarks view

### 👤 User Interface
Account & profile:

37. **`components/user-menu.tsx`** - User dropdown
38. **`components/user-avatar.tsx`** - Avatar display
39. **`components/subscription-badge.tsx`** - Pro badge
40. **`components/subscription-card.tsx`** - Subscription UI

### 🔔 Feedback & Status
User feedback:

41. **`components/toast.tsx`** - Toast notifications
42. **`components/error-message.tsx`** - Error displays
43. **`components/loading-spinner.tsx`** - Loading states
44. **`components/offline-indicator.tsx`** - Offline status
45. **`components/rate-limit-warning.tsx`** - Rate limit notices

### ⌨️ Utilities
Helper components:

46. **`components/keyboard-shortcuts.tsx`** - Keyboard shortcuts
47. **`components/copy-button.tsx`** - Copy to clipboard
48. **`components/markdown-renderer.tsx`** - Markdown display
49. **`components/citation-badge.tsx`** - Citation links
50. **`components/prefetch-provider.tsx`** - Link prefetching

---

## 🎯 Step 3: shadcn/ui Components (Already Included)
These come with every v0 project - no need to copy:
- Button, Card, Dialog, Dropdown Menu, Input, etc.

---

## 🖼️ Step 4: Assets

### Videos (Required!)
**`public/videos/`** - Copy all 4 video files:
- `hero-bg-1.mp4`
- `hero-bg-2.mp4`
- `hero-bg-3.mp4`
- `hero-bg-4.mp4`

### Images
Any images in **`public/images/`** folder

---

## 🛠️ Step 5: Utility Files (Supporting Code)

### State Management
- **`lib/reducers/search-reducer.ts`** - Search state logic

### Type Definitions
- **`lib/types.ts`** - TypeScript interfaces
- **`lib/types/search.ts`** - Search types

### Utilities
- **`lib/toast.ts`** - Toast helper
- **`lib/error-handling.ts`** - Error utilities
- **`lib/constants.ts`** - App constants

---

## 📋 Step 6: How to Use in New v0 Chat

### Method 1: Attach Files (Recommended)
1. Download this project as ZIP
2. In new v0 chat, say: "I have UI components to import"
3. Drag and drop these files one by one:
   - `app/globals.css` (FIRST!)
   - All components from the list above
   - Videos folder
4. Say: "Use these exact components and styling"

### Method 2: Reference URLs
In new chat, say:
\`\`\`
I have a component library. Here are the files I need:
- components/landing/unauthenticated-landing.tsx
- components/search-input.tsx
- components/search-results.tsx
[etc...]

Use the exact styling from app/globals.css with these design tokens:
[paste your colors/fonts]
\`\`\`

### Method 3: Push to GitHub & Pull
1. Push this project to GitHub (click GitHub icon)
2. In new chat: "Pull these components from [repo-url]"

---

## 🎨 Design Tokens Quick Reference

### Colors (from globals.css)
\`\`\`css
--background: 222.2 84% 4.9%
--foreground: 210 40% 98%
--primary: 217.2 91.2% 59.8%
--accent: 217.2 91.2% 59.8%
\`\`\`

### Fonts
- Sans: Geist
- Mono: Geist Mono

### Spacing
- Container max-width: 1400px
- Standard padding: 1rem (16px)
- Large padding: 2rem (32px)

---

## ✅ Verification Checklist

Before starting new project, ensure you have:
- [ ] `app/globals.css` - ALL styling and design tokens
- [ ] All 50 components listed above
- [ ] 4 video files in `public/videos/`
- [ ] `lib/reducers/search-reducer.ts`
- [ ] All utility files from lib/

---

## 🚀 Quick Start Template for New Chat

Copy and paste this into your new v0 chat:

\`\`\`
I'm recreating a Miami.ai search interface with these exact components:

DESIGN:
- Dark theme (near-black background #0a0a0a)
- Primary blue: #3b82f6
- Fonts: Geist Sans, Geist Mono
- Video background hero section
- Glassmorphism effects

COMPONENTS TO USE:
- Search interface with expandable options (model selector, attachments)
- Conversation view with message streaming
- Glowing CTA buttons
- Sidebar with threads and collections
- Model selector dropdown

FILES I'M ATTACHING:
[attach your components here]

Build me a clean new app with proper architecture but use these exact components and styling.
\`\`\`

---

## 📝 Notes

1. **Don't modify components** - Use them exactly as-is for pixel-perfect recreation
2. **Copy globals.css FIRST** - This has all your custom styling
3. **Videos are essential** - The landing page needs those video files
4. **Start with landing page** - Build unauthenticated-landing.tsx first to verify styling works

---

Your UI/UX is production-ready. Just plug these components into a clean backend! 🎉
