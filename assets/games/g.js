const gameGrid = document.getElementById("games-grid");
const searchInput = document.getElementById("search");
const gameContainer = document.getElementById("gameContainer");
const gameContent = document.getElementById("gameContent");
const gameTitleEl = document.getElementById("game-title");

let allGames = [];

// Fetch Games Database
fetch("zones.json")
  .then(r => r.json())
  .then(data => {
    allGames = data;
    render(allGames);
  })
  .catch(err => {
    gameGrid.innerHTML = `<p class="error">Failed to load games: ${err.message}</p>`;
  });

// Render Grid
function render(games) {
  gameGrid.innerHTML = "";

  if (games.length === 0) {
    gameGrid.innerHTML = `<p class="error">No games found.</p>`;
    return;
  }

  games.forEach(game => {
    const card = document.createElement("div");
    card.className = "game-card";

    // Replace placeholders with real URLs
    const cover = game.cover.replace("{COVER_URL}", "https://cdn.jsdelivr.net/gh/gn-math/covers@main");
    const url = game.url.replace("{HTML_URL}", "https://cdn.jsdelivr.net/gh/gn-math/html@main");

    card.innerHTML = `
      <img src="${cover}" alt="${game.name}">
      <div class="game-info">
        <h3>${game.name}</h3>
      </div>
    `;

    card.onclick = () => openGame(game, url);
    gameGrid.appendChild(card);
  });
}

// Search Logic
searchInput.addEventListener("input", e => {
  const q = e.target.value.toLowerCase();
  const filtered = allGames.filter(g => g.name && g.name.toLowerCase().includes(q));
  render(filtered);
});

// Game Viewer Logic
function openGame(game, url) {
  gameTitleEl.textContent = game.name;
  gameContainer.style.display = "flex";
  document.body.style.overflow = "hidden";
  gameContent.innerHTML = `<iframe src="${url}" allowfullscreen style="width:100%; height:100%; border:none;"></iframe>`;
}

window.closeGame = () => {
  gameContainer.style.display = "none";
  document.body.style.overflow = "";
  gameContent.innerHTML = "";
};

window.toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    gameContent.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
};
