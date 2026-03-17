fetch('../json/zones.json')
    .then(response => response.json())
    .then(data => {
        const grid = document.getElementById('games-grid');
        data.forEach(game => {
            const card = document.createElement('div');
            card.className = 'game-card';
            card.innerHTML = `
                <img src="${game.image}" alt="${game.name}">
                <div class="game-info">
                    <h3>${game.name}</h3>
                </div>
            `;
            card.onclick = () => {
                window.parent.loadProxy(game.url);
            };
            grid.appendChild(card);
        });
    });
