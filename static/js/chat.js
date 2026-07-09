/**
 * chat.js — Fitness Buddy Chat Interface
 * Handles message sending, AI response rendering, and chat history.
 */

const chatMessages = document.getElementById('chatMessages');
const chatInput    = document.getElementById('chatInput');
const sendBtn      = document.getElementById('sendBtn');
const typingEl     = document.getElementById('typingIndicator');
const charCountEl  = document.getElementById('charCount');

// Update character counter
chatInput?.addEventListener('input', () => {
  const len = chatInput.value.length;
  charCountEl.textContent = `${len}/2000`;
  charCountEl.style.color = len > 1800 ? '#ef4444' : '';
});

// Keyboard shortcut: Ctrl+Enter or Cmd+Enter to send
chatInput?.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') sendMessage();
});

// Auto-grow textarea
chatInput?.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 160) + 'px';
});


/**
 * Send a user message.
 */
async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  appendMessage('user', text);
  chatInput.value = '';
  chatInput.style.height = 'auto';
  charCountEl.textContent = '0/2000';
  setLoading(true);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });
    const data = await res.json();

    if (!res.ok) {
      appendMessage('error', data.error || 'Something went wrong. Please try again.');
    } else {
      appendMessage('assistant', data.response, data.timestamp);
    }
  } catch (err) {
    appendMessage('error', 'Network error. Please check your connection and try again.');
  } finally {
    setLoading(false);
  }
}


/**
 * Send a pre-filled suggestion.
 */
function sendSuggestion(text) {
  chatInput.value = text;
  sendMessage();
}


/**
 * Append a chat bubble to the messages container.
 */
function appendMessage(role, content, time) {
  const isUser  = role === 'user';
  const isError = role === 'error';
  const now     = time || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const wrapper = document.createElement('div');
  wrapper.className = `fb-msg ${isUser ? 'fb-msg--user' : 'fb-msg--ai'} mb-3 animate-fade-in`;

  const formatted = formatAIResponse(content);

  if (isUser) {
    wrapper.innerHTML = `
      <div class="fb-msg-bubble">
        <div class="fb-msg-content">${escapeHTML(content)}</div>
        <div class="fb-msg-time">${now}</div>
      </div>
      <div class="fb-msg-avatar fb-msg-avatar--user"><i class="bi bi-person-fill"></i></div>`;
  } else if (isError) {
    wrapper.innerHTML = `
      <div class="fb-msg-avatar"><i class="bi bi-exclamation-triangle-fill text-warning"></i></div>
      <div class="fb-msg-bubble">
        <div class="fb-msg-content text-warning"><i class="bi bi-exclamation-circle me-1"></i>${escapeHTML(content)}</div>
        <div class="fb-msg-time">${now}</div>
      </div>`;
  } else {
    wrapper.innerHTML = `
      <div class="fb-msg-avatar"><i class="bi bi-heart-pulse-fill"></i></div>
      <div class="fb-msg-bubble">
        <div class="fb-msg-content">${formatted}</div>
        <div class="fb-msg-time">${now}</div>
      </div>`;
  }

  chatMessages.appendChild(wrapper);
  scrollToBottom();
}


/**
 * Format AI markdown-like responses to HTML.
 */
function formatAIResponse(text) {
  return text
    // Headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Bullets
    .replace(/^[•\-\*] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)+/gs, match => `<ul>${match}</ul>`)
    // Line breaks
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g,   '<br>');
}


/**
 * Escape HTML special characters.
 */
function escapeHTML(str) {
  return str.replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[c]);
}


/**
 * Show/hide typing indicator and disable input.
 */
function setLoading(loading) {
  sendBtn.disabled = loading;
  chatInput.disabled = loading;
  typingEl.classList.toggle('d-none', !loading);
  if (!loading) scrollToBottom();
}


/**
 * Scroll chat to the latest message.
 */
function scrollToBottom() {
  chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
}


/**
 * Clear conversation history.
 */
async function clearChat() {
  if (!confirm('Clear all chat history? This cannot be undone.')) return;
  try {
    await fetch('/api/chat/clear', { method: 'POST' });
    // Remove all messages except the welcome bubble
    const msgs = chatMessages.querySelectorAll('.fb-msg');
    msgs.forEach((m, i) => { if (i > 0) m.remove(); });
    showToast('Chat cleared!', 'info');
  } catch (e) {
    showToast('Could not clear chat.', 'danger');
  }
}


// Scroll to bottom on load
document.addEventListener('DOMContentLoaded', scrollToBottom);
