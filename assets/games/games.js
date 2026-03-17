const COVER_BASE = 'https://raw.githubusercontent.com/DevEchoX2/GravityOS-Assets/main/covers';
const HTML_BASE = 'https://raw.githubusercontent.com/DevEchoX2/GravityOS-Assets/main/files';

fetch('../json/zones.json')
    .then(response => response.json())
    .then(data => {
        const grid = document.getElementById('games-grid');
        data.forEach(game => {
            const card = document.createElement('div');
            card.className = 'game-card';
            
            
            const coverUrl = game.cover.replace('{COVER_URL}', COVER_BASE);
            const gameUrl = game.url.replace('{HTML_URL}', HTML_BASE);

            card.innerHTML = `
                <img src="${coverUrl}" alt="${game.name}" loading="lazy">
                <div class="game-info">
                    <h3>${game.name}</h3>
                    ${game.author ? `<p class="author">By ${game.author}</p>` : ''}
                </div>
            `;
            card.onclick = () => {
                window.parent.loadProxy(gameUrl);
            };
            grid.appendChild(card);
        });
    })
    .catch(err => {
        console.error('Failed to load games:', err);
        const grid = document.getElementById('games-grid');
        grid.innerHTML = '<p class="error">Failed to load games. Check your connection.</p>';
    });
