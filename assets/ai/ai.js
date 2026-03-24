(function() {
    const deobfuscate = (str) => atob(str);
    
    const CONFIG = {
        keys: [
            deobfuscate('Z3NrX214STlDZEs0WmV1b2VHbXZrS0hyV0dyeWIzRlloQWNBbnJUTk5DNEhxUnUyNFdjMnFXMHc=')
        ],
        models: ['grok-beta', 'grok-2-1212', 'grok-2-vision-1212'],
        currentKeyIndex: 0,
        currentModel: 'grok-beta'
    };

    const input = document.getElementById('ai-input');
    const btn = document.getElementById('send-btn');
    const container = document.getElementById('chat-container');
    const typing = document.getElementById('typing-indicator');
    const modelSelect = document.getElementById('model-select');

    function addMessage(text, isUser) {
        const msg = document.createElement('div');
        msg.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        msg.innerText = text;
        container.appendChild(msg);
        container.scrollTop = container.scrollHeight;
        return msg;
    }

    async function callAI(prompt) {
        try {
            const apiKey = CONFIG.keys[CONFIG.currentKeyIndex];
            if (!apiKey) {
                addMessage("No API key found.", false);
                return;
            }

            const response = await fetch('https://api.x.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: CONFIG.currentModel,
                    messages: [
                        { role: 'system', content: 'You are a helpful assistant for gravityOS, a futuristic operating system simulation.' },
                        { role: 'user', content: prompt }
                    ],
                    stream: true
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 401 || response.status === 429) {
                    if (CONFIG.keys.length > 1) {
                        CONFIG.currentKeyIndex = (CONFIG.currentKeyIndex + 1) % CONFIG.keys.length;
                        console.warn('Switching to next API key due to error');
                        return callAI(prompt);
                    }
                }
                throw new Error(errorData.error?.message || 'Grok API error');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiMsg = addMessage('', false);
            let fullContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;
                        try {
                            const json = JSON.parse(data);
                            const content = json.choices[0]?.delta?.content || '';
                            if (content) {
                                fullContent += content;
                                aiMsg.innerText = fullContent;
                                container.scrollTop = container.scrollHeight;
                            }
                        } catch (e) {
                        }
                    }
                }
            }
        } catch (error) {
            console.error('AI Error:', error);
            addMessage(`Error: ${error.message}`, false);
        } finally {
            typing.style.display = 'none';
        }
    }

    btn.onclick = () => {
        const text = input.value;
        if (!text) return;
        addMessage(text, true);
        input.value = '';
        
        typing.style.display = 'block';
        callAI(text);
    };

    input.onkeypress = (e) => {
        if (e.key === 'Enter') btn.onclick();
    };

    if (modelSelect) {
        modelSelect.onchange = (e) => {
            CONFIG.currentModel = e.target.value;
        };
    }

    window.gravityAI = {
        addKey: (key) => { CONFIG.keys.push(key); },
        setKeys: (keys) => { CONFIG.keys = keys; },
        getModels: () => CONFIG.models
    };
})();
