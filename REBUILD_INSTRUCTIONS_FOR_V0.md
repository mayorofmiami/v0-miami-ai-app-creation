# Miami.ai - Complete Rebuild Instructions for v0

## Project Overview
Build a modern AI-powered search and chat application called "Miami.ai" that allows users to search the web with AI assistance and generate images. Focus on clean architecture, proper separation of concerns, and maintainable code.

## Core Features Required

### 1. Public Landing Page (/)
- Hero section with search input
- User can search without authentication
- Display AI-powered search results with sources/citations
- Show related follow-up questions
- Image generation capability
- Model selector dropdown (allow user to choose AI model)
- Smooth animations and professional design
- Use standard v0 design system (don't create custom themes)

### 2. Search Functionality
- Real-time AI search using web results
- Stream responses to the user (don't wait for full response)
- Display sources/citations inline
- Show related searches after response
- Allow follow-up questions in conversation format
- Support image generation as alternative search mode

### 3. User Authentication (Optional Enhancement)
- Sign up / Login / Logout
- Authenticated users get:
  - Search history (saved automatically)
  - Bookmarks (save favorite searches)
  - Collections (organize bookmarks)
  - Personalized settings (preferred model, etc.)

### 4. Authenticated Features (/app)
- Dashboard showing recent searches
- Search history sidebar (click to restore conversation)
- Bookmarks sidebar (save/organize searches)
- Collections management (group related searches)
- Profile page (basic user info)
- Model preference settings

### 5. Admin Panel (/admin) - Optional
- View all users
- Monitor system activity
- Basic analytics dashboard

## Technical Requirements

### Architecture Rules (CRITICAL - Follow These)

1. **API Routes Structure:**
   \`\`\`
   app/api/search/route.ts         - POST: Handle search requests
   app/api/generate-image/route.ts - POST: Handle image generation
   app/api/auth/[...]/route.ts     - Auth endpoints (if using auth)
   \`\`\`

2. **AI SDK Integration:**
   - Use AI SDK v5 (@ai-sdk/*)
   - Use streamText() for search responses with streaming
   - Use generateText() only when you need the full response at once
   - Use Vercel AI Gateway by default (model: "openai/gpt-4o-mini")
   - If Groq integration is available, use: model: groq("llama-3.3-70b-versatile")
   - Handle streaming properly with proper error boundaries

3. **Database (If Authentication Required):**
   - Use Neon Postgres integration
   - Tables needed:
     * users (id, email, password_hash, created_at)
     * search_history (id, user_id, query, response, model, created_at)
     * bookmarks (id, user_id, search_history_id, created_at)
     * collections (id, user_id, name, description, created_at)
     * collection_items (id, collection_id, bookmark_id)
   - Use direct SQL queries with @neondatabase/serverless
   - NO ORMs - keep it simple
   - Create SQL migration scripts in /scripts folder

4. **Search Integration:**
   - Use Tavily API for web search (if available)
   - Or use Exa API as alternative
   - Or use built-in web search if neither available
   - Combine search results with AI synthesis

5. **Image Generation:**
   - Use fal.ai integration if available
   - Model: "fal-ai/flux/schnell" (fast generations)
   - Fall back to alternative if not available

### Code Organization Rules

1. **Server vs Client Components:**
   - Use Server Components by default
   - Only mark components 'use client' when they need:
     * useState, useEffect, useReducer
     * Event handlers (onClick, onChange, etc.)
     * Browser APIs
   - Keep server components for data fetching

2. **File Structure:**
   \`\`\`
   app/
     page.tsx                    - Landing page (Server Component)
     layout.tsx                  - Root layout
     (authenticated)/
       app/
         page.tsx                - Dashboard (Server Component)
         layout.tsx              - Authenticated layout
     api/
       search/route.ts           - Search API
       generate-image/route.ts   - Image generation API
   components/
     landing/
       hero-section.tsx          - Client component
       search-interface.tsx      - Client component
     search/
       search-results.tsx        - Client component
       conversation-view.tsx     - Client component
   lib/
     db.ts                       - Database utilities (server only)
     types.ts                    - Shared TypeScript types
     utils.ts                    - Shared utilities
   \`\`\`

3. **State Management:**
   - Use React Context for global client state (if needed)
   - Use URL search params for shareable state
   - Use SWR for client-side data fetching/caching
   - Keep state as local as possible

4. **Error Handling:**
   - Every API route needs try/catch
   - Return proper HTTP status codes
   - Use error boundaries for React errors
   - Show user-friendly error messages

### Anti-Patterns to AVOID

❌ **DON'T:**
- Mix server and client logic in the same file
- Use fetch() in useEffect (use SWR instead)
- Create circular dependencies between files
- Put database queries in client components
- Use complex state management libraries
- Create your own authentication from scratch (use Stack Auth or similar)
- Query non-existent database columns
- Import server-only code in client components
- Create one massive component file
- Use Redis/caching until you actually need it

✅ **DO:**
- Keep components small and focused
- Separate server and client concerns clearly
- Use proper TypeScript types everywhere
- Test database queries before deploying
- Use environment variables for API keys
- Handle loading and error states
- Stream AI responses for better UX
- Use proper HTTP status codes
- Validate user input on server
- Use prepared statements / parameterized queries

## Implementation Steps

### Phase 1: Foundation
1. Create basic Next.js app structure
2. Set up Tailwind CSS with default v0 theme
3. Create landing page with hero section
4. Add basic search input UI (no functionality yet)

### Phase 2: Core Search
1. Set up Tavily/Exa API integration
2. Create /api/search route handler
3. Integrate AI SDK for response generation
4. Connect search input to API
5. Display results with streaming
6. Add error handling

### Phase 3: Image Generation
1. Set up fal.ai integration
2. Create /api/generate-image route
3. Add image mode toggle to search
4. Display generated images
5. Add loading states

### Phase 4: Authentication (Optional)
1. Add Stack Auth or similar integration
2. Create protected /app routes
3. Set up middleware for auth checks
4. Create login/signup pages

### Phase 5: Authenticated Features
1. Set up Neon database
2. Create database schema
3. Save search history automatically
4. Add bookmarks feature
5. Add collections feature
6. Create settings page

### Phase 6: Polish
1. Add loading skeletons
2. Improve error messages
3. Add keyboard shortcuts
4. Optimize performance
5. Add analytics (optional)

## Example Prompt to Start

\`\`\`
Build Miami.ai - an AI-powered search application.

Features:
- Landing page with search input (public, no auth required)
- AI search using Tavily API + AI SDK streaming responses
- Image generation with fal.ai
- Model selector dropdown
- Display citations/sources
- Show related follow-up questions

Tech stack:
- Next.js 15 App Router
- AI SDK v5 with Vercel AI Gateway
- Streaming responses with streamText()
- Use Server Components where possible
- Clean, simple architecture

Start with:
1. Landing page with hero and search interface
2. /api/search route that uses Tavily + AI SDK
3. Streaming response display
4. Error handling

Use standard v0 components and design system. Keep it simple and maintainable.
\`\`\`

## Key Success Metrics

- Search results stream smoothly without lag
- No console errors on any page
- All API routes return proper status codes
- Database queries use correct column names
- Authentication works without issues
- State management is simple and predictable
- Code is clean and maintainable
- App loads quickly

## Notes

- Start simple, add complexity only when needed
- Test each feature before moving to next
- Use v0's built-in components instead of custom ones
- Follow Next.js best practices
- Keep server and client code separate
- Use TypeScript strictly
- Handle errors gracefully everywhere

---

**Remember:** The goal is a working, maintainable application - not a perfect one. Ship features incrementally and iterate based on what works.
