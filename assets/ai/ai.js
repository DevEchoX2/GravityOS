(function() {
    const deobfuscate = (str) => atob(str);
    
    const CONFIG = {
        keys: [
            deobfuscate('Z3NrX214STlDZEs0WmV1b2VHbXZrS0hyV0dyeWIzRlloQWNBbnJUTk5DNEhxUnUyNFdjMnFXMHc=')
        ],
        geminiKeys: [
            deobfuscate('QUl6YVN5RHlYelFyVGpKSXRCdnpONXJ3Z0pJTjdRQzFYR095UC00'),
            deobfuscate('QUl6YVN5Q1Z3UkJxOU1QMDIvSGlCOTB1b05Wai1WVEkxcll3UnpuSQ==')
        ],
        models: ['grok-beta', 'gemini-1.5-flash'],
        currentKeyIndex: 0,
        currentGeminiKeyIndex: 0,
        currentModel: 'grok-beta'
    };

    const input = document.getElementById('ai-input');
    const btn = document.getElementById('send-btn');
    const container = document.getElementById('chat-container');
    const typing = document.getElementById('typing-indicator');
    const modelSelect = document.getElementById('model-select');
    const screenShareBtn = document.getElementById('screen-share-btn');

    let screenStream = null;
    let videoElement = document.createElement('video');
    let canvasElement = document.createElement('canvas');

    function addMessage(text, isUser) {
        const msg = document.createElement('div');
        msg.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        msg.innerText = text;
        container.appendChild(msg);
        container.scrollTop = container.scrollHeight;
        return msg;
    }

    async function getScreenFrame() {
        if (!screenStream) return null;
        
        const context = canvasElement.getContext('2d');
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
        
        return canvasElement.toDataURL('image/jpeg', 0.8).split(',')[1];
    }

    async function callGemini(prompt) {
        try {
            const apiKey = CONFIG.geminiKeys[CONFIG.currentGeminiKeyIndex];
            if (!apiKey) {
                addMessage("No Gemini API key found.", false);
                return;
            }

            const frame = await getScreenFrame();
            const contents = [
                {
                    parts: [
                        { text: prompt }
                    ]
                }
            ];

            if (frame) {
                contents[0].parts.push({
                    inlineData: {
                        mimeType: "image/jpeg",
                        data: frame
                    }
                });
            }

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.currentModel}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: contents,
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                // Key rotation for Gemini
                if (response.status === 401 || response.status === 429) {
                    if (CONFIG.geminiKeys.length > 1) {
                        CONFIG.currentGeminiKeyIndex = (CONFIG.currentGeminiKeyIndex + 1) % CONFIG.geminiKeys.length;
                        console.warn('Switching to next Gemini API key due to error');
                        return callGemini(prompt);
                    }
                }
                throw new Error(errorData.error?.message || 'Gemini API error');
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";
            addMessage(text, false);
        } catch (error) {
            console.error('Gemini Error:', error);
            addMessage(`Error: ${error.message}`, false);
        } finally {
            typing.style.display = 'none';
        }
    }

    async function callAI(prompt) {
        if (CONFIG.currentModel.startsWith('gemini')) {
            return callGemini(prompt);
        }

        try {
            const apiKey = CONFIG.keys[CONFIG.currentKeyIndex];
            if (!apiKey) {
                addMessage("No Grok API key found.", false);
                return;
            }

            const messages = [
                { role: 'system', content: 'You are a helpful assistant for gravityOS, a futuristic operating system simulation.' },
                { role: 'user', content: prompt }
            ];

            // If vision is needed and model is vision-capable
            if (CONFIG.currentModel.includes('vision')) {
                const frame = await getScreenFrame();
                if (frame) {
                    messages[1].content = [
                        { type: 'text', text: prompt },
                        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${frame}` } }
                    ];
                }
            }

            const response = await fetch('https://api.x.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: CONFIG.currentModel,
                    messages: messages,
                    stream: true
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                // Key rotation for Grok
                if (response.status === 401 || response.status === 429) {
                    if (CONFIG.keys.length > 1) {
                        CONFIG.currentKeyIndex = (CONFIG.currentKeyIndex + 1) % CONFIG.keys.length;
                        console.warn('Switching to next Grok API key due to error');
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

    if (screenShareBtn) {
        screenShareBtn.onclick = async () => {
            if (screenStream) {
                screenStream.getTracks().forEach(track => track.stop());
                screenStream = null;
                screenShareBtn.style.opacity = '0.5';
                screenShareBtn.style.color = 'white';
                return;
            }

            try {
                screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: "always" },
                    audio: false
                });
                
                videoElement.srcObject = screenStream;
                videoElement.play();
                
                screenShareBtn.style.opacity = '1';
                screenShareBtn.style.color = '#3b82f6';
                
                screenStream.getVideoTracks()[0].onended = () => {
                    screenStream = null;
                    screenShareBtn.style.opacity = '0.5';
                    screenShareBtn.style.color = 'white';
                };
            } catch (err) {
                console.error("Error sharing screen:", err);
                alert("Failed to share screen: " + err.message);
            }
        };
    }

    window.gravityAI = {
        addKey: (key) => { CONFIG.keys.push(key); },
        setKeys: (keys) => { CONFIG.keys = keys; },
        getModels: () => CONFIG.models
    };
})();
