const COVER_URL = "https://cdn.jsdelivr.net/gh/gn-math/covers@main";
const HTML_URL = "https://cdn.jsdelivr.net/gh/gn-math/html@main";
const POP_URL = "https://data.jsdelivr.net/v1/stats/packages/gh/gn-math/html@main/files?period=year";

const gameGrid = document.getElementById("games-grid");
const searchInput = document.getElementById("search");
const gameContainer = document.getElementById("gameContainer");
const gameContent = document.getElementById("gameContent");
const gameTitleEl = document.getElementById("game-title");

let allGames = [];
let popularityMap = {};

// 1. Fetch Popularity Stats
fetch(POP_URL)
  .then(r => r.json())
  .then(data => {
    data.forEach(file => {
      const id = parseInt(file.name.replace("/", "").replace(".html", ""));
      popularityMap[id] = file.hits?.total || 0;
    });
  })
  .catch(() => console.warn("Popularity stats unavailable"));

// 2. Fetch Games Database
fetch("/assets/json/zones.json?v=" + Date.now())
  .then(r => r.json())
  .then(data => {
    allGames = data.map(g => ({
      ...g,
      cover: g.cover.replace("{COVER_URL}", COVER_URL),
      url: g.url.replace("{HTML_URL}", HTML_URL),
      popularity: popularityMap[g.id] || 0
    }));

    allGames.sort((a, b) => b.popularity - a.popularity);
    render(allGames);
  })
  .catch(err => {
    gameGrid.innerHTML = `<p class="error">Failed to load games: ${err.message}</p>`;
  });

// 3. Render Grid
function render(games) {
  gameGrid.innerHTML = "";

  if (games.length === 0) {
    gameGrid.innerHTML = `<p class="error">No games found.</p>`;
    return;
  }

  games.forEach(game => {
    const card = document.createElement("div");
    card.className = "game-card";

    card.innerHTML = `
      <img data-src="${game.cover}" alt="${game.name}" loading="lazy" style="opacity: 0; transition: opacity 0.3s;">
      <div class="game-info">
        <h3>${game.name}</h3>
        ${game.author ? `<p class="author">By ${game.author}</p>` : ''}
      </div>
    `;

    card.onclick = () => openGame(game);
    gameGrid.appendChild(card);
  });

  lazyLoadImages();
}

// 4. Lazy Loading Logic
function lazyLoadImages() {
  const images = gameGrid.querySelectorAll("img[data-src]");
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        img.src = img.dataset.src;
        img.onload = () => {
          img.style.opacity = "1";
        };
        img.removeAttribute("data-src");
        obs.unobserve(img);
      });
    },
    { rootMargin: "100px" }
  );
  images.forEach((img) => observer.observe(img));
}

// 5. Search Logic
searchInput.addEventListener("input", e => {
  const q = e.target.value.toLowerCase();
  const filtered = allGames.filter(g => g.name && g.name.toLowerCase().includes(q));
  render(filtered);
});

// 6. Game Viewer Logic
async function openGame(game) {
  gameTitleEl.textContent = game.name;
  gameContainer.style.display = "flex";
  document.body.style.overflow = "hidden";
  gameContent.innerHTML = "";

  const iframe = document.createElement("iframe");
  iframe.allowFullscreen = true;
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";
  iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-popups");
  gameContent.appendChild(iframe);

  try {
    let response = await fetch(game.url + "?t=" + Date.now());
    if (!response.ok) {
      throw new Error(`Game file not found (HTTP ${response.status})`);
    }
    let html = await response.text();
    const base = game.url.substring(0, game.url.lastIndexOf("/") + 1);
    if (!html.match(/<base/i)) {
      html = html.replace("<head>", `<head><base href="${base}">`);
    }

    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(html);
    iframe.contentWindow.document.close();
  } catch (err) {
    gameContent.innerHTML = `<div class="error" style="color: white; padding: 40px; text-align: center;">
      <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
      <p>Failed to load game content: ${err.message}</p>
      <p style="font-size: 0.9rem; margin-top: 10px; opacity: 0.7;">This usually means the file is missing from the repository.</p>
    </div>`;
  }
}

window.closeGame = () => {
  gameContainer.style.display = "none";
  document.body.style.overflow = "";
  gameContent.innerHTML = "";
};

window.toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    gameContent.requestFullscreen().catch(err => {
      console.error(`Error attempting to enable full-screen mode: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
};
