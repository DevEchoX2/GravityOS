const searchInput = document.getElementById('search-input');
const clockEl = document.getElementById('clock');
const greetingEl = document.getElementById('greeting');

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value;
        if (query) {
            window.parent.postMessage({
                type: 'NAVIGATE',
                page: 'proxy',
                query: query
            }, '*');
        }
    }
});

function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    if (clockEl) clockEl.innerText = `${h}:${m}:${s}`;

    const hour = now.getHours();
    let g = "Welcome to gravityOS";
    if (hour < 12) g = "Good Morning, User";
    else if (hour < 18) g = "Good Afternoon, User";
    else g = "Good Evening, User";
    if (greetingEl) greetingEl.innerText = g;
}

setInterval(updateClock, 1000);
updateClock();
