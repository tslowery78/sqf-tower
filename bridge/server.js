/**
 * SQF Tower Bridge Server
 * 
 * WebSocket server that:
 * 1. Receives events from OpenClaw agents (via HTTP POST)
 * 2. Broadcasts to connected frontends (via WebSocket)
 * 3. Maintains agent state
 */

const WebSocket = require('ws');
const express = require('express');
const http = require('http');

const HTTP_PORT = 8081;
const WS_PORT = 8082;

// Agent state
const agents = {
  tom: { status: 'idle', task: null, thought: null, floor: 5 },
  itombot: { status: 'idle', task: null, thought: null, floor: 4 },
  research: { status: 'idle', task: null, thought: null, floor: 3 },
  marketing: { status: 'idle', task: null, thought: null, floor: 2 },
  support: { status: 'idle', task: null, thought: null, floor: 1 }
};

// Activity log (last 50 events)
const activityLog = [];
const MAX_ACTIVITY = 50;

// WebSocket server for frontend connections
const wss = new WebSocket.Server({ port: WS_PORT });
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('Frontend connected');
  clients.add(ws);
  
  // Send current state on connect
  ws.send(JSON.stringify({
    type: 'init',
    data: { agents, activityLog }
  }));
  
  ws.on('close', () => {
    console.log('Frontend disconnected');
    clients.delete(ws);
  });
  
  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
    clients.delete(ws);
  });
});

// Broadcast event to all connected frontends
function broadcast(event) {
  const msg = JSON.stringify(event);
  clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  });
}

// Process incoming event
function processEvent(event) {
  const { type, agent, data } = event;
  const timestamp = Date.now();
  
  // Update agent state based on event type
  if (agents[agent]) {
    switch (type) {
      case 'thinking':
        agents[agent].thought = data.thought;
        agents[agent].status = data.thought ? 'working' : 'idle';
        break;
      case 'status':
        agents[agent].status = data.status;
        agents[agent].task = data.task || agents[agent].task;
        break;
      case 'action':
        // Add to activity log
        activityLog.unshift({
          timestamp,
          agent,
          text: data.action,
          type: 'action'
        });
        break;
      case 'meeting':
        activityLog.unshift({
          timestamp,
          agent,
          text: `Meeting with ${data.with}: ${data.topic}`,
          type: 'meeting'
        });
        break;
    }
  }
  
  // Trim activity log
  while (activityLog.length > MAX_ACTIVITY) {
    activityLog.pop();
  }
  
  // Broadcast to frontends
  broadcast({ ...event, timestamp });
}

// HTTP server for receiving events from OpenClaw
const app = express();
app.use(express.json());

// CORS for local development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', clients: clients.size, agents: Object.keys(agents) });
});

// Get current state
app.get('/state', (req, res) => {
  res.json({ agents, activityLog });
});

// Receive event from OpenClaw agent
app.post('/event', (req, res) => {
  const event = req.body;
  
  if (!event.type || !event.agent) {
    return res.status(400).json({ error: 'Missing type or agent' });
  }
  
  console.log(`Event: ${event.type} from ${event.agent}`);
  processEvent(event);
  
  res.json({ ok: true });
});

// Batch status update (for heartbeat integration)
app.post('/status', (req, res) => {
  const { agent, status, task, thought, recentActions } = req.body;
  
  if (!agent) {
    return res.status(400).json({ error: 'Missing agent' });
  }
  
  // Update agent status
  processEvent({
    type: 'status',
    agent,
    data: { status, task }
  });
  
  // Update thought
  if (thought !== undefined) {
    processEvent({
      type: 'thinking',
      agent,
      data: { thought }
    });
  }
  
  // Add recent actions
  if (recentActions && Array.isArray(recentActions)) {
    recentActions.forEach(action => {
      processEvent({
        type: 'action',
        agent,
        data: { action }
      });
    });
  }
  
  res.json({ ok: true });
});

// Send message to OpenClaw and get response
app.post('/send', async (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Missing message' });
  }
  
  console.log(`Chat message: "${message}"`);
  
  // Update iTomBot to working state
  processEvent({
    type: 'thinking',
    agent: 'itombot',
    data: { thought: 'Processing: ' + message.slice(0, 30) + '...' }
  });
  
  try {
    // Route to OpenClaw via sessions_send or gateway API
    // For now, use the sessions API endpoint
    const { exec } = require('child_process');
    
    const response = await new Promise((resolve, reject) => {
      // Escape the message for shell
      const escapedMessage = message.replace(/'/g, "'\"'\"'");
      
      exec(`openclaw sessions send --message '${escapedMessage}' --timeout 120`, 
        { timeout: 130000 },
        (error, stdout, stderr) => {
          if (error) {
            console.error('OpenClaw error:', error.message);
            // Try to extract any response even on error
            if (stdout) {
              resolve(stdout.trim());
            } else {
              reject(error);
            }
          } else {
            resolve(stdout.trim());
          }
        }
      );
    });
    
    // Clear thought
    processEvent({
      type: 'thinking',
      agent: 'itombot',
      data: { thought: null }
    });
    
    // Add to activity
    processEvent({
      type: 'action',
      agent: 'itombot',
      data: { action: `Chat: "${message.slice(0, 40)}${message.length > 40 ? '...' : ''}"` }
    });
    
    res.json({ response: response || 'Message received', ok: true });
    
  } catch (err) {
    console.error('Failed to send to OpenClaw:', err);
    
    processEvent({
      type: 'thinking',
      agent: 'itombot',
      data: { thought: null }
    });
    
    // Fallback: echo response for testing
    res.json({ 
      response: `[Tower Test Mode] Received: "${message}"`, 
      ok: true,
      test: true
    });
  }
});

// Start HTTP server
app.listen(HTTP_PORT, () => {
  console.log(`Tower Bridge HTTP server running on http://localhost:${HTTP_PORT}`);
  console.log(`Tower Bridge WebSocket server running on ws://localhost:${WS_PORT}`);
  console.log('');
  console.log('Endpoints:');
  console.log('  GET  /health  - Health check');
  console.log('  GET  /state   - Current agent state');
  console.log('  POST /event   - Send single event');
  console.log('  POST /status  - Batch status update (for heartbeat)');
  console.log('  POST /send    - Send chat message to OpenClaw');
  console.log('');
  console.log('Test with:');
  console.log(`  curl -X POST http://localhost:${HTTP_PORT}/event \\`);
  console.log('    -H "Content-Type: application/json" \\');
  console.log('    -d \'{"type":"thinking","agent":"itombot","data":{"thought":"Hello Tower!"}}\'');
});
