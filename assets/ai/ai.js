const chatContainer = document.getElementById('chat-container');
const aiInput = document.getElementById('ai-input');
const sendBtn = document.getElementById('send-btn');

async function sendMessage() {
    const text = aiInput.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    aiInput.value = '';
    
    const loadingMsg = appendMessage('Thinking...', 'ai');
    
    setTimeout(() => {
        loadingMsg.textContent = "I'm a static demo of the gravityOS AI. In a full implementation, I would be connected to the Gemini API to help you with your proxy settings, game recommendations, and more!";
    }, 1500);
}

function appendMessage(text, type) {
    const div = document.createElement('div');
    div.className = type === 'ai' ? 'ai-message' : 'user-message';
    div.textContent = text;
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return div;
}

sendBtn.addEventListener('click', sendMessage);
aiInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
