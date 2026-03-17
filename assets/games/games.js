const COVER_URL = "https://cdn.jsdelivr.net/gh/gn-math/covers@main";
const HTML_URL = "https://cdn.jsdelivr.net/gh/gn-math/html@main";
const POP_URL = "https://data.jsdelivr.net/v1/stats/packages/gh/gn-math/html@main/files?period=year";

const gameGrid = document.getElementById("games-grid");
const searchInput = document.getElementById("search");

let allGames = [];
let popularityMap = {};


fetch(POP_URL)
  .then((r) => r.json())
  .then((data) => {
    data.forEach((file) => {
      const id = parseInt(file.name.replace("/", "").replace(".html", ""));
      popularityMap[id] = file.hits?.total || 0;
    });
  })
  .catch(() => console.warn("Could not load popularity stats."));


fetch("/assets/json/zones.json?v=" + Date.now())
  .then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status} - ${r.statusText}`);
    const contentType = r.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Expected JSON but received " + (contentType || "unknown"));
    }
    return r.json();
  })
  .then((data) => {
    allGames = data.map((g) => ({
      ...g,
      cover: g.cover.replace("{COVER_URL}", COVER_URL),
      url: g.url.replace("{HTML_URL}", HTML_URL),
      popularity: popularityMap[g.id] || 0,
    }));

    
    allGames.sort((a, b) => b.popularity - a.popularity);

    render(allGames);
  })
  .catch((err) => {
    gameGrid.innerHTML = `<p class="error">Failed to load games: ${err.message}</p>`;
  });


function render(games) {
  gameGrid.innerHTML = "";
  
  if (games.length === 0) {
    gameGrid.innerHTML = `<p class="error">No games found.</p>`;
    return;
  }

  games.forEach((game) => {
    const card = document.createElement("div");
    card.className = "game-card";
    
    card.innerHTML = `
      <img data-src="${game.cover}" alt="${game.name}" loading="lazy" style="opacity: 0; transition: opacity 0.3s;">
      <div class="game-info">
        <h3>${game.name}</h3>
        ${game.author ? `<p class="author">By ${game.author}</p>` : ''}
      </div>
    `;

    card.onclick = () => {
        if (window.parent && window.parent.loadProxy) {
            window.parent.loadProxy(game.url);
        } else {
            window.open(game.url, '_blank');
        }
    };
    gameGrid.appendChild(card);
  });

  lazyLoadImages();
}


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


searchInput.addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase();
  const filtered = allGames.filter((g) => g.name && g.name.toLowerCase().includes(query));
  render(filtered);
});
