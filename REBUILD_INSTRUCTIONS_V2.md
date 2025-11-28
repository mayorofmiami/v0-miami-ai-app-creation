# Build Miami.ai - Full-Featured AI Search & Chat Platform

## IMPORTANT: Build Order Strategy

**BUILD THE FULL APP FIRST, AUTH LATER, DEMO LAST**

This approach lets you:
1. Build and test full features at `/app` without auth barriers
2. Perfect the backend and AI functionality
3. Add auth when ready
4. Build limited demo version at `/` last

---

## Overview
Build a powerful AI search and chat application with:
- Multi-modal AI: text chat, web search, image generation, image analysis
- File uploads and vision capabilities
- Real-time streaming responses
- Multiple AI models (GPT, Claude, Llama, Gemini)
- Search history, bookmarks, collections
- User authentication (added later)

## Tech Stack Requirements
- **Framework**: Next.js 16 with App Router
- **AI**: AI SDK v5 with full multi-modal support (`ai`, `@ai-sdk/*`)
- **Database**: Neon Postgres (serverless)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Search API**: Tavily for web search
- **Image Gen**: fal.ai (flux-pro, flux-schnell)
- **Icons**: NO lucide-react. Use native emoji or inline SVG only
- **Auth**: Simple email/password (add in Phase 4)

## Database Schema

\`\`\`sql
-- Users table (add in Phase 4)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conversations/Threads
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages in conversations
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  model VARCHAR(100),
  message_type VARCHAR(50) DEFAULT 'text', -- 'text', 'image', 'search'
  attachments JSONB, -- Store file URLs and metadata
  citations JSONB, -- Store search citations
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bookmarks
CREATE TABLE bookmarks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, message_id)
);

-- Collections
CREATE TABLE collections (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Collection items
CREATE TABLE collection_items (
  id SERIAL PRIMARY KEY,
  collection_id INTEGER REFERENCES collections(id) ON DELETE CASCADE,
  message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

## Core Features (Full AI SDK v5 Capabilities)

### 1. Multi-Modal Chat Interface
**Location**: `/app` (build this FIRST, no auth required initially)

**Capabilities**:
- Text chat with any AI model
- File uploads (images, PDFs, documents)
- Image analysis (vision models)
- Web search with citations
- Image generation
- Streaming responses
- Conversation history

**UI Components**:
- Message list (conversation thread)
- Input area with:
  - Text input
  - File upload button (📎)
  - Model selector dropdown
  - Mode selector (Chat / Search / Image)
  - Send button (➤)
- Sidebar:
  - Conversation history
  - Bookmarked messages
  - Collections

### 2. AI SDK v5 Features to Implement

#### A. Text Streaming with `streamText`
\`\`\`typescript
// app/api/chat/route.ts
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

export async function POST(req: Request) {
  const { messages, model } = await req.json()
  
  const result = streamText({
    model: openai(model || 'gpt-4o-mini'),
    messages,
    maxTokens: 2000,
  })
  
  return result.toUIMessageStreamResponse()
}
\`\`\`

#### B. Web Search Integration
\`\`\`typescript
// app/api/search/route.ts
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

export async function POST(req: Request) {
  const { query, model } = await req.json()
  
  // 1. Get search results from Tavily
  const searchResponse = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      include_answer: true,
      include_raw_content: false,
      max_results: 5,
    }),
  })
  
  const searchData = await searchResponse.json()
  const sources = searchData.results || []
  
  // 2. Stream AI response with citations
  const result = streamText({
    model: openai(model || 'gpt-4o-mini'),
    system: 'You are a helpful search assistant. Use the provided sources to answer questions. Always cite sources using [1], [2], etc.',
    messages: [
      {
        role: 'user',
        content: `Sources:\n${sources.map((s: any, i: number) => 
          `[${i + 1}] ${s.title}\n${s.content}\nURL: ${s.url}`
        ).join('\n\n')}\n\nQuestion: ${query}`
      }
    ],
  })
  
  // Return both the stream and sources
  return new Response(
    result.toDataStream({
      data: { sources }
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    }
  )
}
\`\`\`

#### C. Image Generation with fal.ai
\`\`\`typescript
// app/api/generate-image/route.ts
import { fal } from '@fal-ai/serverless-client'

fal.config({ credentials: process.env.FAL_KEY })

export async function POST(req: Request) {
  const { prompt, model = 'fal-ai/flux-pro' } = await req.json()
  
  const result = await fal.subscribe(model, {
    input: {
      prompt,
      num_images: 1,
      image_size: 'landscape_16_9',
    },
  })
  
  return Response.json({
    image_url: result.images[0].url,
    prompt,
    model,
  })
}
\`\`\`

#### D. Image Analysis (Vision)
\`\`\`typescript
// app/api/analyze-image/route.ts
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

export async function POST(req: Request) {
  const { imageUrl, question, model = 'gpt-4o' } = await req.json()
  
  const result = await generateText({
    model: openai(model),
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: question || 'What is in this image?' },
          { type: 'image', image: imageUrl },
        ],
      },
    ],
  })
  
  return Response.json({ analysis: result.text })
}
\`\`\`

#### E. File Attachments with `useChat`
\`\`\`typescript
// components/chat-interface.tsx
'use client'
import { useChat } from 'ai/react'
import { useState } from 'react'
import ImageIcon from 'lucide-react/ImageIcon'

export function ChatInterface() {
  const { messages, input, setInput, append, isLoading } = useChat({
    api: '/api/chat',
  })
  
  const [attachments, setAttachments] = useState<File[]>([])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Upload attachments first if any
    const attachmentUrls = []
    for (const file of attachments) {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      const { url } = await response.json()
      attachmentUrls.push({ type: file.type.startsWith('image/') ? 'image' : 'file', url })
    }
    
    // Send message with attachments
    await append({
      role: 'user',
      content: input,
      experimental_attachments: attachmentUrls,
    })
    
    setInput('')
    setAttachments([])
  }
  
  return (
    <div>
      {/* Messages */}
      <div className="messages">
        {messages.map((m) => (
          <div key={m.id} className={m.role}>
            <div>{m.content}</div>
            {m.experimental_attachments?.map((att, i) => (
              <div key={i}>
                {att.type === 'image' && <img src={att.url || "/placeholder.svg"} alt="attachment" />}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Input */}
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..."
        />
        
        <input
          type="file"
          multiple
          onChange={(e) => setAttachments(Array.from(e.target.files || []))}
        />
        
        <button type="submit" disabled={isLoading}>
          Send ➤
        </button>
      </form>
    </div>
  )
}
\`\`\`

### 3. Model Support

Support these providers via AI SDK:
- **OpenAI**: gpt-4o, gpt-4o-mini (vision capable)
- **Anthropic**: claude-sonnet-3-5, claude-opus-3-5
- **Google**: gemini-2.0-flash-exp, gemini-1.5-pro (vision capable)
- **Groq**: llama-3.3-70b, llama-3.1-8b (fast inference)
- **xAI**: grok-beta (via AI Gateway)

\`\`\`typescript
// lib/models.ts
export const MODELS = [
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'openai', vision: true },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', vision: true },
  { id: 'anthropic/claude-sonnet-3-5', name: 'Claude Sonnet 3.5', provider: 'anthropic', vision: true },
  { id: 'google/gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', provider: 'google', vision: true },
  { id: 'groq/llama-3.3-70b', name: 'Llama 3.3 70B', provider: 'groq', vision: false },
  { id: 'xai/grok-beta', name: 'Grok Beta', provider: 'xai', vision: false },
]
\`\`\`

### 4. File Upload System

\`\`\`typescript
// app/api/upload/route.ts
import { put } from '@vercel/blob'

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  
  if (!file) {
    return Response.json({ error: 'No file provided' }, { status: 400 })
  }
  
  // Upload to Vercel Blob
  const blob = await put(file.name, file, {
    access: 'public',
  })
  
  return Response.json({
    url: blob.url,
    filename: file.name,
    size: file.size,
    type: file.type,
  })
}
\`\`\`

---

## Implementation Order (BUILD IN THIS EXACT ORDER)

### Phase 1: Foundation
**Goal**: Set up project with basic infrastructure

1. Create Next.js project with TypeScript
2. Install dependencies:
   \`\`\`bash
   npm install ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google-ai-sdk-provider @neondatabase/serverless @vercel/blob @fal-ai/serverless-client
   npm install -D tailwindcss
   \`\`\`
3. Set up Neon database (create tables: conversations, messages)
4. Configure environment variables:
   \`\`\`env
   DATABASE_URL=
   TAVILY_API_KEY=
   FAL_KEY=
   BLOB_READ_WRITE_TOKEN=
   OPENAI_API_KEY= (optional, AI Gateway handles this)
   GROQ_API_KEY=
   \`\`\`

### Phase 2: Core Chat Interface (NO AUTH - Build at `/app`)
**Goal**: Build fully-functional chat at `/app` that you can test immediately

1. Create `/app/page.tsx` - main chat interface
2. Build `components/chat-interface.tsx`:
   - Message list display
   - Streaming message rendering
   - Input area with text and file upload
   - Model selector dropdown
3. Implement `/app/api/chat/route.ts`:
   - Use `streamText` from AI SDK
   - Support multiple models
   - Save messages to database
4. Add conversation history sidebar
5. Test thoroughly - this is your main working app!

**At this point you have a working chat app with no auth barriers**

### Phase 3: Multi-Modal Features
**Goal**: Add web search, image generation, and vision capabilities

1. **Web Search**:
   - Create `/app/api/search/route.ts`
   - Integrate Tavily API
   - Stream responses with citations
   - Add "Search" mode toggle in UI
   
2. **Image Generation**:
   - Create `/app/api/generate-image/route.ts`
   - Integrate fal.ai (flux models)
   - Add "Image" mode toggle in UI
   - Display generated images in chat
   
3. **Image Analysis (Vision)**:
   - Create `/app/api/analyze-image/route.ts`
   - Handle image uploads
   - Use vision-capable models (gpt-4o, gemini-2.0-flash-exp, claude-sonnet-3-5)
   - Display file previews in chat

4. **File Upload System**:
   - Create `/app/api/upload/route.ts`
   - Use Vercel Blob storage
   - Support images, PDFs, documents
   - Show upload progress

### Phase 4: User Features (Still NO AUTH)
**Goal**: Add bookmarks, collections, and persistence

1. **Bookmarks**:
   - Add bookmark button to messages
   - Create `/app/api/bookmarks/route.ts`
   - Show bookmarked messages in sidebar
   
2. **Collections**:
   - Create `/app/collections/page.tsx`
   - Build collection management UI
   - API routes for CRUD operations
   - Drag and drop messages into collections

3. **Share Functionality**:
   - Generate shareable links for conversations
   - Public view page at `/share/[id]`
   - Copy link to clipboard

**At this point, test everything thoroughly without auth getting in the way**

### Phase 5: Add Authentication
**Goal**: Secure the app with user accounts

1. **Auth Setup**:
   - Create users table in database
   - Build signup page: `/signup/page.tsx`
   - Build login page: `/login/page.tsx`
   - Implement Server Actions for auth in `app/actions/auth.ts`
   - Use bcrypt for password hashing
   - Set HTTP-only cookies for sessions

2. **Protect Routes**:
   - Create middleware.ts to check auth
   - Redirect unauthenticated users to `/login`
   - Move main app to `/app` (keep it there)
   
3. **User-Specific Data**:
   - Filter conversations by user_id
   - Filter bookmarks by user_id
   - Filter collections by user_id

### Phase 6: Build Demo/Landing Page (BUILD LAST)
**Goal**: Create limited demo version at root `/`

1. **Landing Page** (`/page.tsx` at root):
   - Hero section with value prop
   - Demo chat interface (limited functionality)
   - Sign up / Login buttons
   - Example queries users can click
   
2. **Demo Limitations**:
   - Limit to 3 messages per session
   - Only allow 1-2 models (gpt-4o-mini, llama-3.3-70b)
   - No file uploads in demo
   - No conversation history
   - Show "Sign up for unlimited access" after limits hit
   - Use localStorage to track demo usage
   
3. **Demo Implementation**:
   \`\`\`typescript
   // app/(demo)/page.tsx
   'use client'
   import { useChat } from 'ai/react'
   import { useState, useEffect } from 'react'
   import ImageIcon from 'lucide-react/ImageIcon'

   export default function DemoPage() {
     const [demoCount, setDemoCount] = useState(0)
     const MAX_DEMO_MESSAGES = 3
     
     useEffect(() => {
       const count = parseInt(localStorage.getItem('demo_count') || '0')
       setDemoCount(count)
     }, [])
     
     const { messages, input, handleSubmit } = useChat({
       api: '/api/demo/chat',
       onFinish: () => {
         const newCount = demoCount + 1
         setDemoCount(newCount)
         localStorage.setItem('demo_count', String(newCount))
       },
     })
     
     if (demoCount >= MAX_DEMO_MESSAGES) {
       return (
         <div>
           <h2>Demo Limit Reached</h2>
           <p>You've used all 3 demo messages. Sign up for unlimited access!</p>
           <a href="/signup">Sign Up Free</a>
         </div>
       )
     }
     
     return (
       <div>
         <div className="demo-badge">
           Demo Mode ({MAX_DEMO_MESSAGES - demoCount} messages left)
         </div>
         {/* Chat interface */}
       </div>
     )
   }
   \`\`\`

4. **Demo API Route**:
   \`\`\`typescript
   // app/api/demo/chat/route.ts
   import { streamText } from 'ai'
   import { openai } from '@ai-sdk/openai'
   
   export async function POST(req: Request) {
     const { messages } = await req.json()
     
     // Enforce demo limits
     if (messages.length > 6) { // 3 exchanges
       return Response.json(
         { error: 'Demo limit exceeded. Please sign up.' },
         { status: 429 }
       )
     }
     
     // Only allow specific models
     const result = streamText({
       model: openai('gpt-4o-mini'),
       messages,
       maxTokens: 500, // Limit response length
     })
     
     return result.toUIMessageStreamResponse()
   }
   \`\`\`

---

## File Structure

\`\`\`
app/
├── (demo)/
│   └── page.tsx                    # Landing page with demo (BUILD LAST)
├── app/
│   ├── page.tsx                    # Main chat app (BUILD FIRST)
│   ├── collections/
│   │   └── page.tsx                # Collections view
│   └── share/[id]/
│       └── page.tsx                # Public share view
├── login/
│   └── page.tsx                    # Login page (ADD IN PHASE 5)
├── signup/
│   └── page.tsx                    # Signup page (ADD IN PHASE 5)
├── api/
│   ├── chat/route.ts               # Main chat endpoint
│   ├── search/route.ts             # Web search with AI
│   ├── generate-image/route.ts     # Image generation
│   ├── analyze-image/route.ts      # Vision analysis
│   ├── upload/route.ts             # File uploads
│   ├── bookmarks/route.ts          # Bookmark CRUD
│   ├── collections/route.ts        # Collection CRUD
│   └── demo/
│       └── chat/route.ts           # Limited demo endpoint
├── actions/
│   ├── auth.ts                     # Auth server actions (ADD IN PHASE 5)
│   ├── conversations.ts            # Conversation management
│   └── collections.ts              # Collection actions
└── layout.tsx

components/
├── chat-interface.tsx              # Main chat UI
├── message-list.tsx                # Display messages
├── message-input.tsx               # Input with file upload
├── model-selector.tsx              # Model dropdown
├── mode-selector.tsx               # Chat/Search/Image toggle
├── conversation-sidebar.tsx        # History sidebar
├── bookmarks-panel.tsx             # Bookmarked messages
├── collection-grid.tsx             # Collections display
├── file-preview.tsx                # Attachment previews
├── citation-links.tsx              # Search citations
└── demo-banner.tsx                 # Demo limit indicator

lib/
├── db.ts                           # Database queries
├── models.ts                       # Model configurations
├── auth.ts                         # Auth utilities (ADD IN PHASE 5)
├── utils.ts                        # General utilities
└── types.ts                        # TypeScript types
\`\`\`

---

## Key Architecture Principles

### ✅ DO THIS:

1. **Server Components for Data Fetching**
   \`\`\`typescript
   // app/app/page.tsx (Server Component)
   import { getConversations } from '@/lib/db'
   
   export default async function AppPage() {
     const conversations = await getConversations()
     return <ChatInterface initialConversations={conversations} />
   }
   \`\`\`

2. **Client Components for Interactivity**
   \`\`\`typescript
   // components/chat-interface.tsx
   'use client'
   import { useChat } from 'ai/react'
   import { useState } from 'react'
   import ImageIcon from 'lucide-react/ImageIcon'

   export function ChatInterface({ initialConversations }) {
     const { messages, input, setInput, append, isLoading } = useChat()
     // ... interactive UI
   }
   \`\`\`

3. **API Routes for AI Operations**
   \`\`\`typescript
   // app/api/chat/route.ts
   import { streamText } from 'ai'
   
   export async function POST(req: Request) {
     const { messages, model } = await req.json()
     const result = streamText({ model, messages })
     return result.toUIMessageStreamResponse()
   }
   \`\`\`

4. **Server Actions for Database Writes**
   \`\`\`typescript
   // app/actions/conversations.ts
   'use server'
   import { sql } from '@/lib/db'
   
   export async function saveMessage(conversationId: number, content: string) {
     return sql`
       INSERT INTO messages (conversation_id, content)
       VALUES (${conversationId}, ${content})
       RETURNING *
     `
   }
   \`\`\`

5. **Simple Database Queries**
   \`\`\`typescript
   // lib/db.ts
   import { neon } from '@neondatabase/serverless'
   
   const sql = neon(process.env.DATABASE_URL!)
   
   export async function getConversations(userId?: number) {
     if (userId) {
       return sql`SELECT * FROM conversations WHERE user_id = ${userId} ORDER BY updated_at DESC`
     }
     return sql`SELECT * FROM conversations ORDER BY updated_at DESC LIMIT 10`
   }
   \`\`\`

### ❌ DON'T DO THIS:

\`\`\`typescript
// ❌ Don't use lucide-react
import ImageIcon from 'lucide-react/ImageIcon' // NO!

// ✅ Use emoji or inline SVG instead
<button>🔍 Search</button>
<button>🖼️ Image</button>
<button>Send ➤</button>

// ❌ Don't query database in client components
'use client'
import { sql } from '@/lib/db' // ERROR!

// ❌ Don't mix server and client in same file
export default async function Page() {
  const data = await sql`...` // Server
  const [state, setState] = useState() // Client - ERROR!
}

// ❌ Don't create circular dependencies
// lib/db.ts imports lib/auth.ts
// lib/auth.ts imports lib/db.ts - BAD!

// ❌ Don't over-engineer
// Keep state management simple
// Use React hooks, not Redux/Zustand
\`\`\`

---

## Testing Checklist

### Phase 2 (After Core Chat):
- [ ] Can send messages and get streaming responses
- [ ] Model selector works and switches models
- [ ] Conversations save to database
- [ ] Sidebar shows conversation history
- [ ] Can click conversation to load it
- [ ] No errors in console

### Phase 3 (After Multi-Modal):
- [ ] Web search returns cited responses
- [ ] Citations link to sources
- [ ] Image generation works
- [ ] Can upload images and analyze them
- [ ] Vision models describe uploaded images
- [ ] File previews show correctly

### Phase 4 (After User Features):
- [ ] Can bookmark messages
- [ ] Bookmarks persist in sidebar
- [ ] Can create collections
- [ ] Can add messages to collections
- [ ] Share links work and show conversation publicly

### Phase 5 (After Auth):
- [ ] Can sign up new account
- [ ] Can log in with existing account
- [ ] Sessions persist with cookies
- [ ] Protected routes redirect to login
- [ ] Each user only sees their own data
- [ ] Logout works correctly

### Phase 6 (After Demo):
- [ ] Landing page loads quickly
- [ ] Demo chat works with limitations
- [ ] Message count tracking works
- [ ] Shows upgrade prompt at limit
- [ ] Sign up button leads to registration
- [ ] Demo doesn't require login

---

## Environment Variables

\`\`\`env
# Database
DATABASE_URL=postgresql://...

# AI Search
TAVILY_API_KEY=tvly-...

# Image Generation  
FAL_KEY=...

# File Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

# AI Models (AI Gateway handles OpenAI, Anthropic by default)
GROQ_API_KEY=gsk_...

# Auth (add in Phase 5)
JWT_SECRET=your-secret-key-here

# Optional: Direct API keys if not using AI Gateway
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=...
\`\`\`

---

## Icons (NO LUCIDE-REACT)

Use emoji or inline SVG only:

\`\`\`typescript
// ✅ Emoji
<button>➤ Send</button>
<button>🔍 Search</button>
<button>🖼️ Generate Image</button>
<button>📎 Attach File</button>
<button>⭐ Bookmark</button>
<button>📁 Collections</button>
<button>🔄 Regenerate</button>
<button>📋 Copy</button>
<button>🔗 Share</button>

// ✅ Inline SVG
<button>
  <svg width="20" height="20" viewBox="0 0 20 20">
    <path d="M10 5v10M5 10h10" stroke="currentColor" strokeWidth="2"/>
  </svg>
  Send
</button>
\`\`\`

---

## Success Criteria

- [ ] Full-featured chat works at `/app` without auth
- [ ] Multi-modal: text, search, images, vision all work
- [ ] File uploads and analysis work
- [ ] Multiple AI models available
- [ ] Streaming responses work smoothly
- [ ] Conversations persist in database
- [ ] Bookmarks and collections work
- [ ] Auth system secure and functional
- [ ] Demo page limits work correctly
- [ ] No console errors
- [ ] Clean, maintainable code
- [ ] NO lucide-react icons used

---

## Start Building

**Begin with Phase 1 and 2. Build the full chat interface at `/app` with no authentication. I want to test it immediately.**

Once you've perfected the backend and features, then add auth in Phase 5, and finally build the demo in Phase 6.
