async function loadGames() {
    try {
        const response = await fetch('../json/zones.json');
        const data = await response.json();
        const grid = document.getElementById('games-grid');
        
        grid.innerHTML = data.games.map(game => `
            <div class="game-card" onclick="window.parent.postMessage({type: 'NAVIGATE', page: 'proxy', url: '${game.url}'}, '*')">
                <img src="${game.thumbnail}" alt="${game.title}" class="game-thumbnail" referrerpolicy="no-referrer">
                <div class="game-info">
                    <h3 class="game-title">${game.title}</h3>
                    <span class="game-category">Web Game</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading games:', error);
    }
}

loadGames();
