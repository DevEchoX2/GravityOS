lucide.createIcons();

const messagesEl = document.getElementById('aiMsgs');
const inputEl = document.getElementById('aiInput');
const sendBtn = document.getElementById('aiSend');
const modelBtn = document.getElementById('modelBtn');
const modelDr = document.getElementById('modelDr');

let convoHistory = [];
let cApiKey = null;

let currModel = 'moonshotai/kimi-k2.5';

function appendMsg(role,text) {
    const welcome = messagesEl.querySelector('.ai-welcome');
    if (welcome) welcome.remove();
    const msg = document.createElement('div');
    msg.className = `msg ${role}`;
    msg.innerHTML = `
    <div class="msg-label">${role === 'user' ? 'you' : `gravityOS AI - ${currModel}`}</div>
    <div class="msg-bubble"></div>`;
    messagesEl.appendChild(msg);
    const bubble = msg.querySelector('.msg-bubble');
    bubble.innerHTML = role === 'ai'?marked.parse(text):text;
    messagesEl.scrollTop=messagesEl.scrollHeight;
    return msg.querySelector('.msg-bubble');
}

function showTyping() {
    const wrapper = document.createElement('div');
    wrapper.className='msg ai';
    wrapper.id='typingInd';
    wrapper.innerHTML = `
    <div class="msg-label">gravityOS AI</div>
    <div class="typing-ind">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    </div>`;
    messagesEl.appendChild(wrapper);
    messagesEl.scrollTop=messagesEl.scrollHeight;
}

function removeTyping() {
    const t = document.getElementById('typingInd');
    if (t) t.remove();
}

inputEl.addEventListener('input',()=>{
    inputEl.style.height='auto';
    inputEl.style.height=Math.min(inputEl.scrollHeight,120)+'px';
});

inputEl.addEventListener('keydown',(e)=>{
    if (e.key==='Enter'&&!e.shiftKey) {
        e.preventDefault();
        sendMsg();
    }
});

sendBtn.addEventListener('click',sendMsg);

async function sendMsg() {
    const text = inputEl.value.trim();
    if (!text) return;
    inputEl.value='';
    inputEl.style.height='auto';
    sendBtn.disabled=true;
    appendMsg('user',text);
    convoHistory.push({role:'user',content:text});
    showTyping();
    try {
        const res = await fetch('https://GravityOS.workers.dev',{
            method:'POST',
            headers:{
                'Content-Type':'application/json',
            },
            body: JSON.stringify({
                model:currModel,
                messages: [
                    {role:'system',content:'you are gravity AI, an assistant for the gravity site.'},
                    ...convoHistory
                ]
            })
        });
        const data = await res.json();
        removeTyping();
        const reply = data.choices?.[0]?.message?.content||'something went wrong.';
        convoHistory.push({role:'assistant',content:reply});
        const bubble = appendMsg('ai',reply);
    } catch (err) {
        removeTyping();
        const bubble = appendMsg('ai','');
        bubble.textContent = 'failed to connect. check your network.';
        console.error(err);
    }
    sendBtn.disabled=false;
    inputEl.focus();
}

modelBtn.addEventListener('click',(e)=>{
    e.stopPropagation();
    modelDr.classList.toggle('open');
    lucide.createIcons();
});

document.addEventListener('click',()=>{
    modelDr.classList.remove('open');
});

document.querySelectorAll('.model-option').forEach(el =>{
    el.addEventListener('click',()=>{
        currModel = el.dataset.model;
        document.getElementById('modelBadge').textContent=el.textContent.trim();
        document.querySelectorAll('.model-option').forEach(o => o.classList.remove('active'));
        el.classList.add('active');
        modelDr.classList.remove('open');
    });
});
