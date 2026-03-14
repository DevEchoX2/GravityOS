const urlInput = document.getElementById('url-input');
const iframe = document.getElementById('proxy-iframe');
const loader = document.getElementById('loader');
const menuBtn = document.getElementById('menu-btn');
const menu = document.getElementById('browser-menu');

urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        let url = urlInput.value.trim();
        if (!url) return;

        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            if (url.includes('.') && !url.includes(' ')) {
                url = 'https://' + url;
            } else {
                url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
            }
        }

        loadUrl(url);
    }
});

function loadUrl(url) {
    loader.style.display = 'flex';
    iframe.style.display = 'none';
    iframe.src = url;
    iframe.onload = () => {
        loader.style.display = 'none';
        iframe.style.display = 'block';
    };
}

menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('hidden');
});

document.addEventListener('click', () => {
    menu.classList.add('hidden');
});

window.addEventListener('message', (event) => {
    if (event.data.type === 'NAVIGATE' && event.data.page === 'proxy') {
        if (event.data.url) {
            urlInput.value = event.data.url;
            loadUrl(event.data.url);
        } else if (event.data.query) {
            urlInput.value = event.data.query;
            loadUrl('https://www.google.com/search?q=' + encodeURIComponent(event.data.query));
        }
    }
    if (event.data.type === 'SET_ENGINE') {
        const tab = document.querySelector(`.engine-tab[data-engine="${event.data.engine}"]`);
        if (tab) tab.click();
    }
});

const engineTabs = document.querySelectorAll('.engine-tab');
engineTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        engineTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        console.log('Switched to engine:', tab.dataset.engine);
    });
});
