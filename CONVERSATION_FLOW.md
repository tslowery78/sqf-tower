# SQF Tower: Conversation Flow Design

## The Goal

Tower app replaces Telegram as the primary interface. Conversations happen IN the game.

---

## User Journey

### 1. Open App
- See building
- You're positioned at Penthouse (top floor)
- Other agents visible on their floors
- Status indicators show who's idle/working

### 2. Send Message
- Text input at bottom of screen (like any chat app)
- Or tap an agent to direct-message them
- Message appears as speech bubble from your avatar

### 3. Agent Receives
- Agent's floor lights up
- Agent shows "received" animation
- Thought bubble: "Thinking..."

### 4. Agent Works
- Working animation (typing, researching, building)
- Thought bubble updates with progress
- Could show tool usage: "📊 Searching web..."

### 5. Agent Delivers
- Agent enters elevator
- Elevator moves to your floor
- Agent "arrives" at Penthouse
- Response appears as speech bubble
- Or expands to full chat panel

### 6. Conversation Continues
- Agent stays on your floor during active conversation
- Returns to their floor when idle
- Multiple agents can visit for group discussions

---

## Message Routing

```
┌──────────────────────────────────────────────────────────────┐
│                     Tower Frontend                            │
│                                                               │
│   User types: "Analyze beachboy4's patterns"                 │
│                           │                                   │
│                           ▼                                   │
│   POST /message { from: "tom", to: "itombot", text: "..." }  │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                     Tower Bridge                              │
│                                                               │
│   1. Broadcast "message_sent" event to frontend              │
│   2. Route message to correct OpenClaw instance              │
│   3. Stream "thinking" events as agent works                 │
│   4. Broadcast "response" when complete                      │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                     OpenClaw (iTomBot)                        │
│                                                               │
│   - Receives message via API or channel                      │
│   - Processes request                                        │
│   - Emits status updates back to bridge                      │
│   - Returns response                                         │
└──────────────────────────────────────────────────────────────┘
```

---

## New Event Types

```typescript
// User sends message
{ 
  type: 'message', 
  from: 'tom', 
  to: 'itombot', 
  text: 'Analyze this market' 
}

// Agent acknowledges
{ 
  type: 'ack', 
  agent: 'itombot', 
  data: { messageId: '123' } 
}

// Agent responds
{ 
  type: 'response', 
  agent: 'itombot', 
  to: 'tom',
  data: { 
    text: 'Here is the analysis...', 
    messageId: '123' 
  } 
}

// Agent moves floors
{ 
  type: 'move', 
  agent: 'itombot', 
  data: { 
    from: 4, 
    to: 5, 
    reason: 'delivering response' 
  } 
}
```

---

## Frontend UI Updates

### Chat Input
```html
<div class="chat-input">
  <select id="chatTarget">
    <option value="itombot">🤖 iTomBot</option>
    <option value="research">🔬 Rex</option>
    <option value="marketing">📣 Mara</option>
  </select>
  <input type="text" id="chatMessage" placeholder="Type a message...">
  <button id="chatSend">Send</button>
</div>
```

### Speech Bubbles
- Tom's messages: Blue bubble, right side
- Agent responses: Gray bubble, left side
- Persist in chat history panel

### Agent Movement
- When agent responds, animate elevator
- Agent sprite moves to Penthouse floor
- Returns after 30s idle or when dismissed

---

## Implementation Phases

### Phase 1: One-Way Display (DONE)
- ✅ Frontend shows building
- ✅ Bridge receives events
- ✅ Agents show thought bubbles
- ✅ Activity feed updates

### Phase 2: Send Messages (NEXT)
- [ ] Add chat input to frontend
- [ ] Bridge routes messages to OpenClaw
- [ ] OpenClaw receives via custom channel or webhook
- [ ] Response routed back to Tower

### Phase 3: Visual Polish
- [ ] Agent movement animations
- [ ] Elevator with agent inside
- [ ] Speech bubbles with proper styling
- [ ] Mobile-optimized layout

### Phase 4: Full Integration
- [ ] Tower becomes primary channel
- [ ] Telegram as backup/notification only
- [ ] Multi-agent conversations
- [ ] Persistent chat history

---

## Technical Challenges

### How does Tower send to OpenClaw?

**Option A: Custom Channel Plugin**
- Build a "tower" channel for OpenClaw
- Messages flow like Telegram/Discord
- Full integration with existing session management

**Option B: HTTP Webhook**
- Tower Bridge has `/send` endpoint
- Bridge calls OpenClaw's API
- Simpler but less integrated

**Option C: Direct WebSocket**
- Frontend connects to OpenClaw gateway
- Bypasses bridge for messages
- Most direct but complex auth

**Recommendation:** Start with Option B (webhook), migrate to A later.

---

## Files to Update

### Frontend
- `app/index.html` — Add chat input
- `app/styles.css` — Chat styling
- `app/app.js` — Send/receive messages

### Bridge  
- `bridge/server.js` — `/send` endpoint, route to OpenClaw

### OpenClaw Integration
- Either: New channel plugin
- Or: Webhook receiver in HEARTBEAT.md
