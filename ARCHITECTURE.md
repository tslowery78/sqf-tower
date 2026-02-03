# SQF Tower: Plumbing Architecture

## Ultimate Vision

**The Tower IS the interface.** Not a dashboard — the primary way Tom talks to agents.

```
┌──────────────────────────────────────────────────────────────┐
│                    Tom's Phone/Laptop                         │
│                                                               │
│   ┌─────────────────────────────────────────────────────┐    │
│   │                   SQF Tower App                      │    │
│   │                                                      │    │
│   │   [Penthouse - Tom's Office]                        │    │
│   │   ┌─────────────────────────────────────────────┐   │    │
│   │   │  👨‍💼 Tom                                      │   │    │
│   │   │  "Hey, analyze this market"                 │   │    │
│   │   │  [Text input]                               │   │    │
│   │   └─────────────────────────────────────────────┘   │    │
│   │                                                      │    │
│   │   [Floor 4 - iTomBot]                               │    │
│   │   ┌─────────────────────────────────────────────┐   │    │
│   │   │  🤖 *typing animation*                       │   │    │
│   │   │  💭 "Researching market..."                 │   │    │
│   │   └─────────────────────────────────────────────┘   │    │
│   │                                                      │    │
│   │   *iTomBot takes elevator up*                       │    │
│   │   *Arrives at Penthouse*                            │    │
│   │   *Delivers response*                               │    │
│   │                                                      │    │
│   └─────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### User Experience

1. **Open app** → See building, you're in Penthouse
2. **Type message** → Message sent to agent
3. **Watch agent work** → Typing animation, thought bubbles
4. **Agent comes to you** → Elevator animation, arrives at your floor
5. **Response delivered** → Speech bubble or chat panel

### Why This Is Cool

- **Spatial presence** — Agents feel like they exist somewhere
- **Visual feedback** — See work happening, not just waiting
- **Personality** — Each agent has their floor, their vibe
- **Async natural** — Send message, watch them work, response when ready

---

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     SQF Tower Frontend                       │
│              (Browser - phone/laptop/desktop)                │
│                                                              │
│   [Building View]  [Activity Feed]  [Agent Details]         │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ WebSocket (wss://)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Tower Bridge Server                       │
│                  (Node.js - runs locally)                    │
│                                                              │
│   - Aggregates OpenClaw events                              │
│   - Broadcasts to connected frontends                        │
│   - Maintains agent state                                    │
│   - Handles inter-agent messaging (future)                   │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
     ┌──────────┐    ┌──────────┐    ┌──────────┐
     │ OpenClaw │    │ OpenClaw │    │ OpenClaw │
     │ iTomBot  │    │   Rex    │    │  Mara    │
     │ :18789   │    │  :18790  │    │  :18791  │
     └──────────┘    └──────────┘    └──────────┘
```

---

## Phase 1: Single Agent (Current Setup)

Wire iTomBot to the Tower.

### Event Sources

OpenClaw emits activity we can capture:
1. **Session activity** — When agent starts/stops working
2. **Tool calls** — What tools are being used
3. **Messages** — Incoming/outgoing messages

### Bridge Implementation

```javascript
// tower-bridge.js
// Watches OpenClaw logs/events, broadcasts to frontend

const WebSocket = require('ws');
const { watch } = require('fs');
const { spawn } = require('child_process');

const wss = new WebSocket.Server({ port: 8081 });
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
});

function broadcast(event) {
  const msg = JSON.stringify(event);
  clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  });
}

// Option A: Watch OpenClaw logs
function watchLogs() {
  const logPath = `${process.env.HOME}/.openclaw/logs/gateway.log`;
  // Parse logs for activity
}

// Option B: Poll session status
async function pollStatus() {
  // Use openclaw CLI to get session info
  const result = await exec('openclaw sessions list --json');
  // Parse and emit changes
}

// Option C: Hook into heartbeat (recommended)
// Add a webhook/callback in HEARTBEAT.md that pings the bridge
```

---

## Phase 2: Event Types

### Core Events

```typescript
interface TowerEvent {
  type: 'thinking' | 'action' | 'meeting' | 'status';
  agent: string;        // 'itombot', 'research', etc.
  timestamp: number;
  data: any;
}

// Examples:
{ type: 'thinking', agent: 'itombot', data: { thought: 'Analyzing whale patterns...' } }
{ type: 'action', agent: 'itombot', data: { action: 'Completed Perplexity analysis' } }
{ type: 'meeting', agent: 'itombot', data: { with: 'research', topic: 'Sharing data' } }
{ type: 'status', agent: 'itombot', data: { status: 'working' | 'idle' } }
```

---

## Phase 3: Heartbeat Integration

The cleanest approach: **Heartbeat pings the Tower.**

Add to HEARTBEAT.md:
```markdown
## Tower Status Update (Every Heartbeat)
1. POST current status to Tower bridge: http://localhost:8081/status
2. Include: current task, recent actions, thinking state
```

Bridge receives:
```json
{
  "agent": "itombot",
  "status": "working",
  "task": "Analyzing Polymarket",
  "recentActions": ["Fetched whale data", "Wrote analysis"],
  "thought": "Processing trade history..."
}
```

---

## Phase 4: Multi-Agent (Future)

When we add more agents:

1. **Each agent has unique ID** in their config
2. **Bridge aggregates** events from multiple OpenClaw instances
3. **Inter-agent comms** via shared message queue or direct WebSocket

```
Agent A                Bridge              Agent B
   │                     │                    │
   │─── "Need research"──▶│                    │
   │                     │───"Task from A"───▶│
   │                     │                    │
   │                     │◀──"Here's data"────│
   │◀───"Research done"──│                    │
```

---

## Implementation Plan

### Week 1: Basic Plumbing
- [ ] Create tower-bridge.js server
- [ ] WebSocket connection from frontend
- [ ] Manual event injection for testing
- [ ] iTomBot heartbeat posts to bridge

### Week 2: Real Integration
- [ ] Parse OpenClaw session activity
- [ ] Auto-detect working/idle state
- [ ] Capture tool calls as actions
- [ ] Display real thoughts (from agent output)

### Week 3: Polish
- [ ] Deploy frontend to Vercel
- [ ] Bridge runs as service
- [ ] Phone access working
- [ ] Multiple agent support

---

## Quick Start (Today)

1. **Start the bridge:**
```bash
cd projects/sqf-tower
node bridge/server.js
```

2. **Start the frontend:**
```bash
cd projects/sqf-tower/app
python3 -m http.server 8080
```

3. **Test event injection:**
```bash
curl -X POST http://localhost:8081/event \
  -H "Content-Type: application/json" \
  -d '{"type":"thinking","agent":"itombot","data":{"thought":"Testing the tower..."}}'
```

4. **Frontend updates in real-time!**

---

## Files to Create

```
projects/sqf-tower/
├── README.md           # Project overview
├── ARCHITECTURE.md     # This file
├── app/                # Frontend
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── bridge/             # Backend
│   ├── package.json
│   ├── server.js       # WebSocket server
│   └── openclaw.js     # OpenClaw integration
└── deploy/             # Deployment configs
    └── vercel.json
```
