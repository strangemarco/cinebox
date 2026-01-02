import { TMDB_API_KEY, TMDB_BASE, IMG_BASE } from "./config.js";

/* =====================
   STATE
===================== */
let isSearching = false;
let lastSearchResults = [];
let activeSearchFilter = "all";

/* =====================
   HELPERS
===================== */
function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

async function tmdbFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("TMDB error");
  return res.json();
}

function normalizeItem(item, typeFallback = "movie") {
  return {
    id: item.id,
    type: item.media_type || typeFallback,
    title: item.title || item.name,
    year: (item.release_date || item.first_air_date || "").slice(0, 4),
    rating10: item.vote_average || 0,
    poster: item.poster_path ? IMG_BASE + item.poster_path : "",
    description: item.overview || "Sin descripción disponible."
  };
}

/* =====================
   GENERIC FETCH
===================== */
async function fetchList(endpoint, typeFallback) {
  const separator = endpoint.includes("?") ? "&" : "?";
  const url = `${TMDB_BASE}${endpoint}${separator}api_key=${TMDB_API_KEY}&language=es-ES`;
  const data = await tmdbFetch(url);
  return (data.results || []).map(item => normalizeItem(item, typeFallback));
}

/* =====================
   RENDER CAROUSEL
===================== */
function renderCarousel(containerId, list) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  list.forEach(item => {
    const card = document.createElement("div");
    card.className = "movie-card";

    const label = item.type === "tv" ? "Series" : "Movie";

    card.innerHTML = `
      <img src="${item.poster || "https://via.placeholder.com/300x450"}">
      <span class="movie-type ${label.toLowerCase()}">${label}</span>
      <div class="movie-info">
        <h3>${escapeHtml(item.title)}</h3>
        <span>${item.year || "—"}</span>
      </div>
    `;

    card.onclick = () => {
      window.location.href = `detail.html?id=${item.id}&type=${item.type}`;
    };

    container.appendChild(card);
  });
}

/* =====================
   LOAD HOME
===================== */
async function loadHome() {
  try {
    renderCarousel("trendings", await fetchList("/trending/all/day", "movie"));

    renderCarousel("topRated", await fetchList("/movie/top_rated", "movie"));
    renderCarousel("upcoming", await fetchList("/movie/upcoming", "movie"));

    renderCarousel("seriesTrending", await fetchList("/trending/tv/day", "tv"));
    renderCarousel("seriesTopRated", await fetchList("/tv/top_rated", "tv"));
    renderCarousel("seriesPopular", await fetchList("/tv/popular", "tv"));

    renderCarousel(
      "animePopular",
      await fetchList("/discover/tv?with_keywords=210024&sort_by=popularity.desc", "tv")
    );

    renderCarousel("action", await fetchList("/discover/movie?with_genres=28", "movie"));
    renderCarousel("horror", await fetchList("/discover/movie?with_genres=27", "movie"));
    renderCarousel("drama", await fetchList("/discover/movie?with_genres=18", "movie"));

  } catch (e) {
    console.error("Error cargando Home", e);
  }
}

/* =====================
   CAROUSEL CONTROLS
===================== */
document.querySelectorAll(".carousel-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = document.getElementById(btn.dataset.target);
    if (!target) return;

    const offset = btn.classList.contains("next") ? 600 : -600;
    target.scrollBy({ left: offset, behavior: "smooth" });
  });
});

/* =====================
   HOME SECTION FILTER
===================== */
function filterHomeSections(type) {
  document.querySelectorAll("[data-section]").forEach(section => {
    const sectionType = section.dataset.section;

    if (type === "all" || sectionType === "all" || sectionType === type) {
      section.style.display = "";
    } else {
      section.style.display = "none";
    }
  });
}

/* =====================
   SEARCH
===================== */
const searchInput = document.getElementById("search");
const moviesGrid = document.getElementById("movies");
const homeSection = document.querySelector(".home-section");

let searchTimeout = null;

searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim();
  clearTimeout(searchTimeout);

  if (!query) {
    isSearching = false;
    moviesGrid.innerHTML = "";
    moviesGrid.style.display = "none";
    homeSection.style.display = "block";
    filterHomeSections(activeSearchFilter);
    return;
  }

  isSearching = true;

  searchTimeout = setTimeout(() => {
    searchTMDB(query);
  }, 500);
});

async function searchTMDB(query) {
  try {
    homeSection.style.display = "none";
    moviesGrid.style.display = "grid";
    moviesGrid.innerHTML = "🔍 Buscando...";

    const url = `${TMDB_BASE}/search/multi?api_key=${TMDB_API_KEY}&language=es-ES&query=${encodeURIComponent(query)}`;
    const data = await tmdbFetch(url);

    lastSearchResults = (data.results || [])
      .filter(item => item.media_type === "movie" || item.media_type === "tv")
      .map(item => normalizeItem(item, item.media_type));

    applySearchFilter();

  } catch {
    moviesGrid.innerHTML = "❌ Error al buscar";
  }
}

function renderSearchResults(list) {
  moviesGrid.innerHTML = "";

  if (!list.length) {
    moviesGrid.innerHTML = "😕 No se encontraron resultados";
    return;
  }

  list.forEach(item => {
    const label =
      item.type === "tv" &&
      /naruto|one piece|attack|bleach|dragon/i.test(item.title)
        ? "Anime"
        : item.type === "tv"
        ? "Series"
        : "Movie";

    const card = document.createElement("div");
    card.className = "movie-card";

    card.innerHTML = `
      <img src="${item.poster || "https://via.placeholder.com/300x450"}">
      <span class="movie-type ${label.toLowerCase()}">${label}</span>
      <div class="movie-info">
        <h3>${escapeHtml(item.title)}</h3>
        <span>${item.year || "—"}</span>
      </div>
    `;

    card.onclick = () => {
      window.location.href = `detail.html?id=${item.id}&type=${item.type}`;
    };

    moviesGrid.appendChild(card);
  });
}

function applySearchFilter() {
  let filtered = lastSearchResults;

  if (activeSearchFilter === "movie") {
    filtered = filtered.filter(i => i.type === "movie");
  }

  if (activeSearchFilter === "series") {
    filtered = filtered.filter(i => i.type === "tv");
  }

  if (activeSearchFilter === "anime") {
    filtered = filtered.filter(
      i =>
        i.type === "tv" &&
        /naruto|one piece|attack|bleach|dragon/i.test(i.title)
    );
  }

  renderSearchResults(filtered);
}

/* =====================
   FILTER BUTTONS (NAVBAR)
===================== */
document.querySelectorAll(".nav-filter").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-filter")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");
    activeSearchFilter = btn.dataset.filter;

    if (isSearching) {
      applySearchFilter();      // 🔍 filtra resultados de búsqueda
    } else {
      filterHomeSections(activeSearchFilter); // 🏠 filtra carruseles
    }
  });
});


/* =====================
   THEME TOGGLE
===================== */
const themeBtn = document.getElementById("themeToggle");

themeBtn?.addEventListener("click", () => {
  document.body.classList.toggle("light");
  themeBtn.textContent =
    document.body.classList.contains("light") ? "🌞" : "🌙";
});

/* =====================
   INIT
===================== */
loadHome();
filterHomeSections("all");

/* =====================
   DROPDOWN TMDB LOADERS
===================== */

// PELÍCULAS
document.querySelectorAll("[data-movie]").forEach(btn => {
  btn.addEventListener("click", async () => {
    const type = btn.dataset.movie;

    homeSection.style.display = "none";
    moviesGrid.style.display = "grid";
    moviesGrid.innerHTML = "🎬 Cargando películas...";

    const list = await fetchList(`/movie/${type}`, "movie");
    renderSearchResults(list);
  });
});

// SERIES
document.querySelectorAll("[data-tv]").forEach(btn => {
  btn.addEventListener("click", async () => {
    const type = btn.dataset.tv;

    homeSection.style.display = "none";
    moviesGrid.style.display = "grid";
    moviesGrid.innerHTML = "📺 Cargando series...";

    const list = await fetchList(`/tv/${type}`, "tv");
    renderSearchResults(list);
  });
});





/* =====================
   DROPDOWN FIX (NO CLOSE ON CLICK)
===================== */
document.querySelectorAll(".dropdown").forEach(dropdown => {
  const toggle = dropdown.querySelector("button");
  const menu = dropdown.querySelector(".dropdown-menu");

  if (!toggle || !menu) return;

  // Abrir / cerrar con click
  toggle.addEventListener("click", e => {
    e.stopPropagation();

    // Cierra otros dropdowns
    document.querySelectorAll(".dropdown.open").forEach(d => {
      if (d !== dropdown) d.classList.remove("open");
    });

    dropdown.classList.toggle("open");
  });

  // Evita que el menú se cierre al hacer click dentro
  menu.addEventListener("click", e => {
    e.stopPropagation();
  });
});

// Cerrar dropdown al hacer click fuera
document.addEventListener("click", () => {
  document.querySelectorAll(".dropdown.open")
    .forEach(d => d.classList.remove("open"));
});

// Cerrar con ESC
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    document.querySelectorAll(".dropdown.open")
      .forEach(d => d.classList.remove("open"));
  }
});

document.getElementById("logoHome")?.addEventListener("click", () => {
  sessionStorage.removeItem("cinebox_state");
});

const navbar = document.querySelector(".navbar");

window.addEventListener("scroll", () => {
  if (window.scrollY > 40) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});
