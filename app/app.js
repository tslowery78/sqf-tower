// SQF Tower - App Logic

// Configuration
const BRIDGE_WS_URL = 'ws://localhost:8082';
const BRIDGE_HTTP_URL = 'http://localhost:8081';

// Agent data (will be updated from bridge)
const agents = {
  tom: {
    name: 'Tom',
    avatar: '👨‍💼',
    role: 'CEO',
    floor: 5,
    status: 'idle',
    task: 'Reviewing strategy',
    thought: null,
    memory: ['Approved SQF Tower project', 'Discussed Docker instances', 'Requested whale analysis']
  },
  itombot: {
    name: 'iTomBot',
    avatar: '🤖',
    role: 'COO/CTO',
    floor: 4,
    status: 'working',
    task: 'Analyzing Polymarket whale patterns',
    thought: 'Analyzing whale patterns...',
    memory: ['Completed beachboy4 analysis', 'Drafted memory architecture post', 'Researched multi-instance Docker']
  },
  research: {
    name: 'Rex',
    avatar: '🔬',
    role: 'Research',
    floor: 3,
    status: 'idle',
    task: 'Awaiting assignment',
    thought: null,
    memory: ['Analyzed Perplexity AI market', 'Researched Agent Lightning']
  },
  marketing: {
    name: 'Mara',
    avatar: '📣',
    role: 'Marketing',
    floor: 2,
    status: 'idle',
    task: 'Planning content calendar',
    thought: null,
    memory: ['Prepared Moltbook posts', 'Drafted X thread']
  },
  support: {
    name: 'Sam',
    avatar: '🎧',
    role: 'Support',
    floor: 1,
    status: 'idle',
    task: 'Monitoring channels',
    thought: null,
    memory: ['Responded to Discord', 'Updated FAQ']
  }
};

// WebSocket connection
let ws = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 3000;

function connectWebSocket() {
  console.log('Connecting to Tower Bridge...');
  updateConnectionStatus('connecting');
  
  try {
    ws = new WebSocket(BRIDGE_WS_URL);
    
    ws.onopen = () => {
      console.log('Connected to Tower Bridge');
      reconnectAttempts = 0;
      updateConnectionStatus('online');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleEvent(data);
      } catch (err) {
        console.error('Failed to parse event:', err);
      }
    };
    
    ws.onclose = () => {
      console.log('Disconnected from Tower Bridge');
      updateConnectionStatus('offline');
      scheduleReconnect();
    };
    
    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      updateConnectionStatus('offline');
    };
  } catch (err) {
    console.error('Failed to connect:', err);
    updateConnectionStatus('offline');
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    console.log(`Reconnecting in ${RECONNECT_DELAY/1000}s (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
    setTimeout(connectWebSocket, RECONNECT_DELAY);
  }
}

function updateConnectionStatus(status) {
  const dot = document.querySelector('.status-dot');
  const text = document.querySelector('.status span:last-child');
  
  dot.className = 'status-dot';
  
  switch (status) {
    case 'online':
      dot.classList.add('online');
      text.textContent = 'Live';
      break;
    case 'connecting':
      text.textContent = 'Connecting...';
      break;
    case 'offline':
      text.textContent = 'Offline';
      break;
  }
}

// Handle incoming events from bridge
function handleEvent(event) {
  console.log('Event:', event);
  
  switch (event.type) {
    case 'init':
      // Initial state from bridge
      if (event.data.agents) {
        Object.entries(event.data.agents).forEach(([id, state]) => {
          if (agents[id]) {
            Object.assign(agents[id], state);
            updateAgentUI(id);
          }
        });
      }
      if (event.data.activityLog) {
        event.data.activityLog.forEach(activity => {
          addActivityToFeed(activity.agent, activity.text, activity.type === 'meeting');
        });
      }
      break;
      
    case 'thinking':
      updateAgentThought(event.agent, event.data.thought);
      break;
      
    case 'status':
      if (agents[event.agent]) {
        agents[event.agent].status = event.data.status;
        agents[event.agent].task = event.data.task || agents[event.agent].task;
        updateAgentUI(event.agent);
      }
      break;
      
    case 'action':
      addActivityToFeed(event.agent, event.data.action, false);
      // Add to agent memory
      if (agents[event.agent]) {
        agents[event.agent].memory.unshift(event.data.action);
        if (agents[event.agent].memory.length > 10) {
          agents[event.agent].memory.pop();
        }
      }
      break;
      
    case 'meeting':
      addActivityToFeed(event.agent, `Meeting with ${event.data.with}: ${event.data.topic}`, true);
      showMeetingAnimation(event.agent, event.data.with);
      break;
  }
}

// Update agent UI elements
function updateAgentUI(agentId) {
  const agent = agents[agentId];
  const el = document.querySelector(`[data-agent="${agentId}"]`);
  if (!el || !agent) return;
  
  // Update status classes
  el.classList.remove('working', 'idle');
  el.classList.add(agent.status);
  
  // Update thought bubble
  const bubble = el.querySelector('.thought-bubble');
  if (agent.thought) {
    bubble.textContent = agent.thought;
    bubble.classList.remove('hidden');
  } else {
    bubble.classList.add('hidden');
  }
}

// Update agent thought bubble
function updateAgentThought(agentId, thought) {
  if (agents[agentId]) {
    agents[agentId].thought = thought;
    agents[agentId].status = thought ? 'working' : 'idle';
    updateAgentUI(agentId);
  }
}

// Add activity to feed
function addActivityToFeed(agentId, text, isMeeting = false) {
  const agent = agents[agentId];
  if (!agent) return;
  
  const feed = document.getElementById('activityFeed');
  
  const time = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
  
  const item = document.createElement('div');
  item.className = `activity-item${isMeeting ? ' meeting' : ''}`;
  item.innerHTML = `
    <span class="activity-time">${time}</span>
    <span class="activity-agent">${agent.avatar} ${agent.name}</span>
    <span class="activity-text">${text}</span>
  `;
  
  feed.insertBefore(item, feed.firstChild);
  
  // Keep feed manageable
  while (feed.children.length > 20) {
    feed.removeChild(feed.lastChild);
  }
}

// Show meeting animation (elevator)
function showMeetingAnimation(fromId, toId) {
  const fromAgent = agents[fromId];
  const toAgent = agents[toId];
  if (!fromAgent || !toAgent) return;
  
  const elevator = document.getElementById('elevator');
  const car = elevator.querySelector('.elevator-car');
  
  // Calculate positions
  const fromPos = (5 - fromAgent.floor) * 100;
  const toPos = (5 - toAgent.floor) * 100;
  
  car.style.transform = `translateY(${fromPos}px)`;
  
  setTimeout(() => {
    car.style.transform = `translateY(${toPos}px)`;
  }, 500);
}

// Open agent detail modal
function openModal(agentId) {
  const agent = agents[agentId];
  if (!agent) return;
  
  document.getElementById('modalAvatar').textContent = agent.avatar;
  document.getElementById('modalName').textContent = agent.name;
  document.getElementById('modalRole').textContent = agent.role;
  document.getElementById('modalTask').textContent = agent.task || 'No active task';
  
  const memoryList = document.getElementById('modalMemory');
  memoryList.innerHTML = agent.memory.map(m => `<li>${m}</li>`).join('');
  
  document.getElementById('agentModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('agentModal').classList.add('hidden');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Add click handlers to agents
  document.querySelectorAll('.agent').forEach(el => {
    el.addEventListener('click', () => {
      openModal(el.dataset.agent);
    });
  });
  
  // Close modal on background click
  document.getElementById('agentModal').addEventListener('click', (e) => {
    if (e.target.id === 'agentModal') {
      closeModal();
    }
  });
  
  // Connect to bridge
  connectWebSocket();
  
  // Update all agent UIs
  Object.keys(agents).forEach(updateAgentUI);
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});

// Chat Interface
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');
const chatMessages = document.getElementById('chatMessages');

let isWaitingForResponse = false;

function addChatMessage(text, type, agentName = null) {
  // Remove welcome message if present
  const welcome = chatMessages.querySelector('.chat-welcome');
  if (welcome) welcome.remove();
  
  const msg = document.createElement('div');
  msg.className = `chat-message ${type}`;
  
  if (agentName) {
    msg.innerHTML = `<div class="agent-tag">${agentName}</div>${text}`;
  } else {
    msg.textContent = text;
  }
  
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  return msg;
}

function showTypingIndicator() {
  const indicator = document.createElement('div');
  indicator.className = 'chat-message agent typing';
  indicator.id = 'typingIndicator';
  indicator.innerHTML = '<div class="agent-tag">🤖 iTomBot</div>Thinking';
  chatMessages.appendChild(indicator);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
  const indicator = document.getElementById('typingIndicator');
  if (indicator) indicator.remove();
}

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text || isWaitingForResponse) return;
  
  // Add user message
  addChatMessage(text, 'user');
  chatInput.value = '';
  
  // Update iTomBot to working state
  updateAgentThought('itombot', 'Processing message...');
  
  // Show typing indicator
  isWaitingForResponse = true;
  chatSend.disabled = true;
  showTypingIndicator();
  
  try {
    // Send to bridge
    const response = await fetch(`${BRIDGE_HTTP_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });
    
    removeTypingIndicator();
    
    if (response.ok) {
      const data = await response.json();
      
      // Move elevator to user floor (lobby) then back up
      showMeetingAnimation('itombot', 'support');
      
      setTimeout(() => {
        addChatMessage(data.response || data.message || 'Response received', 'agent', '🤖 iTomBot');
        showMeetingAnimation('support', 'itombot');
      }, 600);
      
      // Add to activity feed
      addActivityToFeed('itombot', `Responded to chat: "${text.slice(0, 30)}${text.length > 30 ? '...' : ''}"`, false);
    } else {
      addChatMessage('Failed to get response. Bridge may be offline.', 'agent', '⚠️ System');
    }
  } catch (err) {
    removeTypingIndicator();
    console.error('Chat error:', err);
    addChatMessage('Could not reach the tower. Bridge offline.', 'agent', '⚠️ System');
  }
  
  // Reset state
  updateAgentThought('itombot', null);
  isWaitingForResponse = false;
  chatSend.disabled = false;
  chatInput.focus();
}

// Event listeners
chatSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});
