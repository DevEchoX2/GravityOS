let tabs = [];
let activeTabId = null;
let scramjetCtrl = null;

let gravityConfig = {
    engine: localStorage.getItem('gravity_engine') || 'uv',
    transport: localStorage.getItem('gravity_transport') || 'epoxy',
    wisp: localStorage.getItem('gravity_wisp') || 'wss://wisp.rhw.one/'
};

async function initProxyEngines() {
    scramjetCtrl = null;

    if (window.BareMux) {
        try {
            const conn = new BareMux.BareMuxConnection("/ixlmath/baremux/worker.js");
            const transportPath = gravityConfig.transport === 'epoxy' 
                ? "/ixlmath/epoxy/index.mjs" 
                : "/ixlmath/libcurl/index.mjs";
                
            await conn.setTransport(transportPath, [{ websocket: gravityConfig.wisp }]);
        } catch (e) {
            console.error("BareMux init failed:", e);
        }
    }

    if (gravityConfig.engine === 'uv') {
        try {
            if ('serviceWorker' in navigator) {
                await navigator.serviceWorker.register('/uv/sw.js', {
                    scope: __uv$config.prefix
                });
            }
        } catch (e) {
            console.error("UV SW registration failed:", e);
        }
    } 
    else if (gravityConfig.engine === 'scramjet') {
        try {
            if ('serviceWorker' in navigator) {
                await navigator.serviceWorker.register('/ixlmath/scram/sw.js', {
                    scope: "/ixlmath/go/"
                });
            }

            if (window.$scramjetLoadController) {
                const { ScramjetController } = window.$scramjetLoadController();
                scramjetCtrl = new ScramjetController({
                    files: { 
                        all: "/ixlmath/scram/scramjet.all.js", 
                        wasm: "/ixlmath/scram/scramjet.wasm.wasm", 
                        sync: "/ixlmath/scram/scramjet.sync.js" 
                    },
                    prefix: "/ixlmath/go/" 
                });
                if (typeof scramjetCtrl.init === 'function') {
                    scramjetCtrl.init();
                }
            }
        } catch (e) {
            console.error("Scramjet init failed:", e);
        }
    }
}

function openSettings() {
    document.getElementById('browser-menu').style.display = 'none';
    document.getElementById('setting-engine').value = gravityConfig.engine;
    document.getElementById('setting-transport').value = gravityConfig.transport;
    document.getElementById('setting-wisp').value = gravityConfig.wisp;
    document.getElementById('settings-modal').style.display = 'block';
}

function closeSettings() {
    document.getElementById('settings-modal').style.display = 'none';
}

async function saveSettings() {
    gravityConfig.engine = document.getElementById('setting-engine').value;
    gravityConfig.transport = document.getElementById('setting-transport').value;
    gravityConfig.wisp = document.getElementById('setting-wisp').value;
    
    localStorage.setItem('gravity_engine', gravityConfig.engine);
    localStorage.setItem('gravity_transport', gravityConfig.transport);
    localStorage.setItem('gravity_wisp', gravityConfig.wisp);
    
    closeSettings();
    await initProxyEngines();
    
    const url = document.getElementById('url-bar').value;
    if(url && !url.includes('newtab.html')) {
        launchProxy();
    }
}

function createNewTab(url = 'newtab.html') {
    const id = Date.now().toString();
    const tab = { id: id, url: url, title: 'New Tab' };
    tabs.push(tab);
    
    const tabEl = document.createElement('div');
    tabEl.className = 'browser-tab';
    tabEl.id = `tab-${id}`;
    tabEl.innerHTML = `
        <span class="tab-title">New Tab</span>
        <span class="tab-close" onclick="closeTab(event, '${id}')">×</span>
    `;
    tabEl.onclick = () => switchTab(id);
    
    const container = document.getElementById('tabs-container');
    container.insertBefore(tabEl, container.lastElementChild);
    
    const viewport = document.createElement('iframe');
    viewport.id = `viewport-${id}`;
    viewport.className = 'browser-viewport';
    viewport.style.cssText = 'width:100%; height:100%; border:none; display:none; position:absolute; top:0; left:0; background:white;';
    viewport.src = url;
    viewport.onload = () => {
        injectExtensions(viewport);
        updateTabTitle(id, viewport);
    };
    
    document.getElementById('viewports-container').appendChild(viewport);
    switchTab(id);
}

function switchTab(id) {
    activeTabId = id;
    document.querySelectorAll('.browser-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('iframe').forEach(v => v.style.display = 'none');
    
    const activeTab = document.getElementById(`tab-${id}`);
    const activeViewport = document.getElementById(`viewport-${id}`);
    
    if (activeTab) activeTab.classList.add('active');
    if (activeViewport) {
        activeViewport.style.display = 'block';
        const url = activeViewport.src;
        document.getElementById('url-bar').value = (url.includes('newtab.html') || url === 'about:blank') ? '' : url;
    }
}

function closeTab(e, id) {
    e.stopPropagation();
    if (tabs.length === 1) return;
    
    const index = tabs.findIndex(t => t.id === id);
    tabs.splice(index, 1);
    
    document.getElementById(`tab-${id}`).remove();
    document.getElementById(`viewport-${id}`).remove();
    
    if (activeTabId === id) {
        switchTab(tabs[Math.max(0, index - 1)].id);
    }
}

function updateTabTitle(id, iframe) {
    try {
        const title = iframe.contentDocument.title || 'New Tab';
        const titleEl = document.querySelector(`#tab-${id} .tab-title`);
        if (titleEl) titleEl.innerText = title;
    } catch (e) {}
}

function encodeScramjetUrl(url) {
    if (scramjetCtrl && typeof scramjetCtrl.encodeUrl === 'function') {
        return scramjetCtrl.encodeUrl(url);
    }
    if (window.$scramjet && typeof window.$scramjet.encodeUrl === 'function') {
        return window.$scramjet.encodeUrl(url);
    }
    return "/ixlmath/go/" + btoa(url); 
}

function launchProxy() {
    const url = document.getElementById('url-bar').value;
    if (!url) return;
    
    if (url.startsWith('javascript:')) {
        const code = url.slice(11);
        const viewport = document.getElementById(`viewport-${activeTabId}`);
        if (viewport) {
            try { viewport.contentWindow.eval(decodeURIComponent(code)); } 
            catch (e) { console.error(e); }
        }
        return;
    }
    
    let targetUrl = url;
    if (!url.startsWith('http')) {
        const engine = document.getElementById('search-engine').value;
        const engines = {
            google: 'https://www.google.com/search?q=',
            duckduckgo: 'https://duckduckgo.com/?q=',
            brave: 'https://search.brave.com/search?q=',
            bing: 'https://www.bing.com/search?q='
        };
        targetUrl = (engines[engine] || engines.google) + encodeURIComponent(url);
    }
    
    let encodedUrl = targetUrl;
    
    if (gravityConfig.engine === 'uv' && window.__uv$config) {
        encodedUrl = __uv$config.prefix + __uv$config.encodeUrl(targetUrl);
    } else if (gravityConfig.engine === 'scramjet') {
        encodedUrl = encodeScramjetUrl(targetUrl);
    }
    
    const viewport = document.getElementById(`viewport-${activeTabId}`);
    if (viewport) {
        viewport.src = encodedUrl;
        document.querySelector(`#tab-${activeTabId} .tab-title`).innerText = 'Loading...';
    }
}

function goBack() {
    const viewport = document.getElementById(`viewport-${activeTabId}`);
    if (viewport) viewport.contentWindow.history.back();
}

function goForward() {
    const viewport = document.getElementById(`viewport-${activeTabId}`);
    if (viewport) viewport.contentWindow.history.forward();
}

function reloadTab() {
    const viewport = document.getElementById(`viewport-${activeTabId}`);
    if (viewport) viewport.contentWindow.location.reload();
}

function toggleMenu() {
    const menu = document.getElementById('browser-menu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function injectExtensions(iframe) {
    const extensions = JSON.parse(localStorage.getItem('gravity_extensions') || '[]');
    extensions.forEach(ext => {
        if (ext.enabled) {
            try {
                const script = iframe.contentDocument.createElement('script');
                script.textContent = ext.code;
                iframe.contentDocument.body.appendChild(script);
            } catch (e) {}
        }
    });
}

window.addEventListener('message', (event) => {
    if (event.data.type === 'loadUrl') {
        document.getElementById('url-bar').value = event.data.url;
        launchProxy();
    }
});

document.getElementById('url-bar').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') launchProxy();
});

initProxyEngines();
createNewTab();
