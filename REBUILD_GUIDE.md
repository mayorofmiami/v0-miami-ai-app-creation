# Miami.ai Rebuild Guide

## Goal
Rebuild the app with clean architecture while preserving ALL visual design and UI components.

## What We're Saving (Your Hard Work)
- ✅ All UI components (search, chat, landing pages)
- ✅ Complete design system (colors, fonts, spacing)
- ✅ All visual layouts and styles
- ✅ Authentication UI (login, signup forms)
- ✅ Admin panel designs
- ✅ Navigation and sidebar designs

## What We're Rebuilding
- ❌ Database schema (clean, organized tables)
- ❌ API routes (better structured)
- ❌ State management (cleaner patterns)
- ❌ Auth logic (keeping UI, rewriting backend)

## Step-by-Step Rebuild Process

### Phase 1: Save Current Work (Do This Now)
1. Download ZIP from v0 (three dots → Download ZIP)
2. Push to GitHub (GitHub icon → push to repo)
3. Keep this version open in a browser tab as reference

### Phase 2: Extract Visual Components
Copy these folders to a safe location:
\`\`\`
miami-components/
├── components/
│   ├── landing/              # Landing page designs
│   ├── search-page/          # Search interface
│   ├── admin/                # Admin panel UI
│   ├── ui/                   # Base UI components (shadcn)
│   └── [all other visual components]
├── app/globals.css           # Your theme and design system
├── public/                   # Images, videos, assets
└── DESIGN_TOKENS.md          # Color palette, fonts, spacing
\`\`\`

### Phase 3: Start Clean Rebuild in v0
1. Create new v0 project
2. Set up clean database schema (users, searches, threads only)
3. Build basic auth system
4. **Drop in your saved components** (copy/paste)
5. Wire up new clean APIs to old visual components

### Phase 4: Component Drop-In Order
1. Design system first (globals.css, theme)
2. Base UI components (buttons, cards, inputs)
3. Landing page (your video background design)
4. Search interface (your chat UI)
5. Authentication pages (your login/signup designs)
6. Admin panel (your dashboard design)

## Key Files to Preserve

### Design System
- `app/globals.css` - ALL your theme colors and design tokens
- Theme variables (cyan, pink, dark backgrounds)

### Landing Pages
- `components/landing/unauthenticated-landing.tsx` - Your hero design
- `components/landing/authenticated-landing.tsx` - Your app interface
- Video background setup

### Search Interface
- `components/search-page/conversation-view.tsx` - Chat UI design
- `components/search-input.tsx` - Search bar design
- `components/search-results.tsx` - Results display
- `components/model-selector.tsx` - Model switcher UI

### Authentication
- `app/login/page.tsx` - Your login form design
- `app/signup/page.tsx` - Your signup form design
- Auth form styling

### Navigation
- `components/collapsible-sidebar.tsx` - Your sidebar design
- Navigation patterns

### Admin Panel
- `app/(admin)/admin/page.tsx` - Dashboard layout
- `components/admin/` - All admin components

## Next Steps

**Option A: Rebuild in Same Project**
1. I delete everything except components/
2. Rebuild clean database + APIs
3. Reconnect components to new APIs

**Option B: Fresh Start (Recommended)**
1. Start new v0 project
2. Copy saved components over
3. Build clean architecture around them

**Which do you want to do?**
