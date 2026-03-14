# Step 16: AI Concierge Chat UI — Streaming Claude + RAG

**Status**: Complete
**Commit**: `40760e6` — "Add AI Concierge Chat UI with streaming Claude + RAG"

## What Was Built

### 1. Streaming Chat API (`src/app/api/v1/chat/route.ts`)
- **POST /api/v1/chat** — Authenticated SSE streaming endpoint
- Loads concierge system prompt (hunting domain expert)
- Retrieves RAG context from embedded state agency documents
- Injects RAG context into Claude's system prompt
- Streams response tokens via Server-Sent Events
- Keeps last 20 messages for conversation context
- Graceful RAG fallback (works without embeddings)

### 2. Chat Components (`src/components/chat/`)
**ChatContainer.tsx** — Main chat orchestrator
- Manages message state and streaming lifecycle
- Welcome message introduces the concierge
- Auto-scrolls to latest message
- Sends conversation history for multi-turn context
- Error handling with user-friendly messages

**ChatMessage.tsx** — Message bubble component
- User messages (right-aligned, forest green)
- Assistant messages (left-aligned, cream/bark)
- Streaming cursor animation while generating
- Avatar icons (User / Crosshair)

**ChatInput.tsx** — Input component
- Auto-expanding textarea (up to 160px)
- Enter to send, Shift+Enter for newline
- Send button with active/disabled states
- Disabled during streaming

### 3. Chat Page (`src/app/(dashboard)/chat/page.tsx`)
- Full-height layout (accounts for mobile bottom nav)
- Already linked in Sidebar and BottomTabBar navigation
- Mobile-optimized with safe area padding

## Architecture

```
User types question
  ↓
ChatInput → ChatContainer.sendMessage()
  ↓
POST /api/v1/chat { message, history }
  ↓
├── auth() — verify session
├── loadPrompt("concierge") — hunting expert system prompt
├── assembleContext(message) — Gemini RAG search (top 3 docs)
├── Build full system prompt with RAG context
└── streamMessage() — Claude SDK streaming
  ↓
SSE stream: data: {"text": "..."}\n\n
  ↓
ChatContainer reads stream → updates assistant message token by token
  ↓
data: [DONE]
```

## Data Flow
```
User: "What are the draw odds for WY elk Unit 100?"
  ↓
RAG: cosine_similarity("WY elk draw odds Unit 100")
  → WY Application Dates & Deadlines (0.72)
  → WY Regulations (0.69)
  ↓
System Prompt: [concierge prompt] + [RAG context with real WGFD data]
  ↓
Claude: Streams personalized response referencing actual agency data
```

## Navigation
- **Mobile**: Bottom tab bar → "Chat" (MessageCircle icon)
- **Desktop**: Sidebar → "Chat" (MessageCircle icon)
- Route: `/chat`

## Env Vars Required
- `ANTHROPIC_API_KEY` — Claude SDK (streaming)
- `GEMINI_API_KEY` — RAG embedding search

## Design
- Brand colors: forest green user bubbles, cream assistant bubbles
- Crosshair icon for concierge avatar (hunting theme)
- Responsive: full-height on mobile with bottom nav offset
- Dark mode supported
