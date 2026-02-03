# SQF Tower: Multi-Agent Company Simulation

**Concept:** A visual simulation of SideQuest Forge as a building, where each AI agent owns a floor, works on tasks, and interacts with other agents.

> *"The Tower is the interface."* — Not a dashboard. The primary way you talk to your AI agents.

---

## Product Vision

### The Problem

AI agents are invisible. You chat with them in terminals, Telegram, or bland dashboards. There's no sense of **presence** — no feeling that your agent exists somewhere, doing something.

### The Solution

**SQF Tower** gives your AI agents a home. A building where:
- Each agent has their own floor
- You watch them work in real-time
- They come to your office to deliver responses
- Multi-agent collaboration is visible

### Why It Matters

| Pain Point | Tower Solution |
|------------|----------------|
| "Is my agent doing anything?" | Watch them work, see thought bubbles |
| "Agent responses feel robotic" | Spatial presence adds personality |
| "Can't visualize multi-agent" | See agents meet, collaborate, report |
| "Dashboards are boring" | It's a game — fun to watch |

### Target Users

1. **AI Agent Enthusiasts** — OpenClaw, AutoGPT, Claude users
2. **Small Teams** — Visual way to manage AI workers
3. **Educators** — Teaching multi-agent systems
4. **Marketers** — "Watch my AI company run itself"

---

## Business Model Options

### Option A: Open Source (Current Plan)
- Core released under MIT license
- Build community around it
- SideQuest Forge gets brand visibility
- Fits OpenClaw ecosystem philosophy

### Option B: Open Core
| Tier | Price | Features |
|------|-------|----------|
| Community | Free | Self-hosted, 3 agents, basic themes |
| Pro | $19/mo | Hosted, 10 agents, custom avatars, priority support |
| Team | $49/mo | Multi-user, shared building, analytics, API access |

### Option C: Full SaaS
- Hosted-only
- Subscription pricing
- Full support included
- Higher margin, higher effort

**Current approach:** Build MVP, validate interest, then decide.

---

## Validation Plan

1. **Ship MVP** ✅ (done)
2. **Demo internally** — Tom tests on phone
3. **Post on Moltbook** — Agent community feedback
4. **Post on X** — Broader reach
5. **Measure interest** — Stars, forks, DMs
6. **Decide model** — Based on traction

---

## Inspiration

Stanford's "Generative Agents" paper (2023):
- 25 agents living in a simulated town
- Each had memories, daily routines, social interactions
- Agents formed relationships, planned parties, spread gossip
- Paper: https://arxiv.org/abs/2304.03442
- Code: https://github.com/joonspk-research/generative_agents

---

## Our Vision: SQF Tower

Instead of a town → a **company building**.

| Floor | Agent | Role | Focus |
|-------|-------|------|-------|
| 5 (Penthouse) | Tom (human) | CEO | Strategy, approvals |
| 4 | iTomBot | COO/CTO | Operations, engineering |
| 3 | Research Agent | Analyst | Market research, competitive intel |
| 2 | Marketing Agent | Growth | Content, social, outreach |
| 1 (Lobby) | Support Agent | Customer | Tickets, feedback, community |
| Basement | DevOps Agent | Infra | Monitoring, deployments |

---

## Visual Elements

### Building View
- 2D side-view of building (like a game)
- Each floor shows the agent at their desk
- Speech/thought bubbles show current activity
- Agents animate when working vs idle

### Movement
- Agents take elevator to other floors for meetings
- Visual indication of inter-agent communication
- "Thinking" animation when processing

### Activity Feed
- Real-time log of what each agent is doing
- Click agent to see their memory/context
- See conversations between agents

---

## Technical Architecture

### Option A: Fork Generative Agents
- Use Stanford's codebase as base
- Replace town map with building map
- Wire agents to OpenClaw instances
- **Pros:** Proven architecture
- **Cons:** Python/Django, dated codebase

### Option B: Modern Stack (Recommended)
```
┌─────────────────────────────────────────────┐
│           Frontend (React/Phaser)           │
│  - Building visualization                   │
│  - Agent sprites + animations               │
│  - Real-time activity feed                  │
│  - Click-to-inspect agent state             │
└─────────────────────────────────────────────┘
                     │ WebSocket
                     ▼
┌─────────────────────────────────────────────┐
│         Orchestration Layer (Node)          │
│  - Agent scheduling (who acts when)         │
│  - Inter-agent message routing              │
│  - State management                         │
│  - Activity logging                         │
└─────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ OpenClaw │  │ OpenClaw │  │ OpenClaw │
│ Agent 1  │  │ Agent 2  │  │ Agent 3  │
│ (Docker) │  │ (Docker) │  │ (Docker) │
└──────────┘  └──────────┘  └──────────┘
```

### Option C: Lightweight MVP
- Single OpenClaw with multiple "personas"
- Simple web frontend (HTML/JS)
- No Docker complexity initially
- **Pros:** Fast to build, low resource
- **Cons:** Not true multi-agent

---

## Key Features

### 1. Agent Personas
Each agent has:
- Name + avatar
- Role description
- Personality traits
- Expertise areas
- Communication style

### 2. Memory System
- Each agent has their own MEMORY.md
- Can reference what they've done
- Remember past conversations with other agents

### 3. Inter-Agent Communication
- Agents can "visit" other floors
- Structured conversations
- Pass tasks/context between agents

### 4. Task System
- Kanban integration (our existing board)
- Agents claim tasks
- Report completion
- Escalate blockers

### 5. Visualization
- Real-time activity bubbles
- "Thinking..." indicators
- Conversation logs
- Historical replay

---

## MVP Scope (Week 1)

1. **Simple HTML/CSS building visual**
   - 4 floors, static layout
   - Agent avatars on each floor

2. **Single OpenClaw with personas**
   - iTomBot, Research, Marketing as "modes"
   - Switch context based on task

3. **Activity feed**
   - WebSocket from OpenClaw
   - Show what agent is doing

4. **No agent-to-agent chat yet**
   - Just visualization of single agent's work

---

## Full Vision (Month 1+)

1. **Multiple Docker containers**
   - True isolated agents
   - Each with own memory

2. **Agent router**
   - Orchestrates who works on what
   - Manages inter-agent requests

3. **Phaser.js game engine**
   - Animated sprites
   - Elevator movements
   - Particle effects for "thinking"

4. **Persistent world state**
   - Save/load simulation
   - Replay historical days

---

## Why This Matters

1. **Visualization of agent work** — See what's happening, not just read logs
2. **Multi-agent coordination** — Agents specialize and collaborate
3. **Demo/marketing gold** — Incredible visual for SQF brand
4. **Learn multi-agent patterns** — Real experience with agent orchestration
5. **Fun** — It's a game about your company running itself

---

## Resources

- Stanford paper: https://arxiv.org/abs/2304.03442
- Original code: https://github.com/joonspk-research/generative_agents
- Phaser.js (game engine): https://phaser.io/
- Tiled (map editor): https://www.mapeditor.org/

---

## Next Steps

1. [x] Build MVP: static visual + activity feed
2. [x] Create bridge server for real-time events
3. [ ] Tom tests on phone at home
4. [ ] Add chat input (send messages to agents)
5. [ ] Wire to OpenClaw for real agent activity
6. [ ] Post demo on Moltbook + X
7. [ ] Gauge interest, decide open source vs SaaS

---

## Quick Start

```bash
# Clone and run
cd projects/sqf-tower
./start.sh

# Opens:
#   Frontend: http://localhost:8080
#   Bridge:   http://localhost:8081

# Test from phone (same network):
#   http://<your-mac-ip>:8080
```

---

## Project Status

| Component | Status |
|-----------|--------|
| Frontend (building view) | ✅ Done |
| Bridge server | ✅ Done |
| Real-time events | ✅ Done |
| Agent thought bubbles | ✅ Done |
| Activity feed | ✅ Done |
| Chat input | 🔲 Next |
| OpenClaw integration | 🔲 Planned |
| Mobile optimization | 🔲 Planned |
| Vercel deployment | 🔲 Planned |
