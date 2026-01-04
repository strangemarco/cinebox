
import { TMDB_API_KEY, TMDB_BASE, IMG_BASE } from "./config.js";
import { saveTheme, loadTheme } from "./storage.js";
import { saveState, loadState } from "./state.js";

function setList(type, endpoint) {
  saveState({
    filter: activeSearchFilter,
    scrollY: window.scrollY,
    search: searchInput?.value || "",
    view: "list",
    listType: type,        // movie | tv | anime
    listEndpoint: endpoint // popular | upcoming | on_the_air
  });
}


/* =====================
   THEME (LOCAL STORAGE)
===================== */
const themeBtn = document.getElementById("themeToggle");

// aplicar tema guardado al cargar
const savedTheme = loadTheme();

if (savedTheme === "light") {
  document.body.classList.add("light");
  if (themeBtn) themeBtn.textContent = "🌞";
} else {
  if (themeBtn) themeBtn.textContent = "🌙";
}

// toggle de tema
themeBtn?.addEventListener("click", () => {
  document.body.classList.toggle("light");

  const isLight = document.body.classList.contains("light");
  saveTheme(isLight ? "light" : "dark");

  themeBtn.textContent = isLight ? "🌞" : "🌙";
});




/* =====================
   STATE
===================== */
let isSearching = false;
let lastSearchResults = [];
let activeSearchFilter = "all";

function setView(view) {
  saveState({
    filter: activeSearchFilter,
    scrollY: window.scrollY,
    search: searchInput?.value || "",
    view
  });
}



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
  saveState({
    filter: activeSearchFilter,
    scrollY: window.scrollY,
    search: searchInput?.value || ""
  });

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
  setView("home");
  moviesGrid.innerHTML = "";
  moviesGrid.style.display = "none";
  homeSection.style.display = "block";
  filterHomeSections(activeSearchFilter);
  return;
}


  isSearching = true;
  setView("search");


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
  saveState({
    filter: activeSearchFilter,
    scrollY: window.scrollY,
    search: searchInput?.value || ""
  });

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

    // Quitar activo
    document.querySelectorAll(".nav-filter").forEach(b =>
      b.classList.remove("active")
    );
    btn.classList.add("active");

    const filter = btn.dataset.filter || "all";
    activeSearchFilter = filter;

    // Mostrar secciones
    isSearching ? applySearchFilter() : filterHomeSections(filter);

    // Scroll automático según categoría
    let targetId = null;

    if (filter === "movie") targetId = "movies-section";
    if (filter === "series") targetId = "series-section";
    if (filter === "anime") targetId = "anime-section";

    if (targetId) {
      const section = document.getElementById(targetId);
      if (section) {
        section.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }

    // ✅ GUARDAR STATE AL CAMBIAR FILTRO
    saveState({
      filter: activeSearchFilter,
      scrollY: window.scrollY,
      search: searchInput?.value || ""
    });
  });
});

/* =====================
   SAVE STATE ON SCROLL
===================== */
window.addEventListener("scroll", () => {
  saveState({
    filter: activeSearchFilter,
    scrollY: window.scrollY,
    search: searchInput?.value || ""
  });
});




/* =====================
   DROPDOWN TMDB LOADERS
===================== */

// PELÍCULAS
document.querySelectorAll("[data-movie]").forEach(btn => {
  btn.addEventListener("click", async () => {
    const endpoint = btn.dataset.movie;

    setList("movie", endpoint);

    homeSection.style.display = "none";
    moviesGrid.style.display = "grid";
    moviesGrid.innerHTML = "🎬 Cargando películas...";

    const list = await fetchList(`/movie/${endpoint}`, "movie");
    renderSearchResults(list);
  });
});


// SERIES
document.querySelectorAll("[data-tv]").forEach(btn => {
  btn.addEventListener("click", async () => {
    const endpoint = btn.dataset.tv;

    setList("tv", endpoint);

    homeSection.style.display = "none";
    moviesGrid.style.display = "grid";
    moviesGrid.innerHTML = "📺 Cargando series...";

    const list = await fetchList(`/tv/${endpoint}`, "tv");
    renderSearchResults(list);
  });
});

/* =====================
   ANIME DROPDOWN
===================== */
document.querySelectorAll("[data-anime]").forEach(btn => {
  btn.addEventListener("click", async () => {
    setList("anime", "popular");

    homeSection.style.display = "none";
    moviesGrid.style.display = "grid";
    moviesGrid.innerHTML = "🎌 Cargando anime...";

    const list = await fetchList(
      `/discover/tv?with_keywords=210024&sort_by=popularity.desc`,
      "tv"
    );

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
  localStorage.removeItem("cinebox_state");
});

const navbar = document.querySelector(".navbar");

window.addEventListener("scroll", () => {
  if (window.scrollY > 40) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});




/* =====================
   INIT + RESTORE STATE (FIXED)
===================== */
(async () => {
  const savedState = loadState();

  // 1. Restaurar filtro lógico
  if (savedState?.filter) {
    activeSearchFilter = savedState.filter;
  }

  // 2. Cargar Home y ESPERAR
  await loadHome();

  // 3. Restaurar botón activo del navbar
  document.querySelectorAll(".nav-filter").forEach(btn => {
    btn.classList.toggle(
      "active",
      btn.dataset.filter === activeSearchFilter
    );
  });

  // 4. Aplicar filtro visual
  filterHomeSections(activeSearchFilter);

  // 5. Restaurar vista
  if (savedState?.view === "search" && savedState.search) {
    searchInput.value = savedState.search;
    isSearching = true;
    searchTMDB(savedState.search);
  }
if (savedState?.view === "list" && savedState.listType) {
  homeSection.style.display = "none";
  moviesGrid.style.display = "grid";
  moviesGrid.innerHTML = "⏳ Restaurando contenido...";

  let endpoint = "";

  if (savedState.listType === "movie") {
    endpoint = `/movie/${savedState.listEndpoint}`;
  }

  if (savedState.listType === "tv") {
    endpoint = `/tv/${savedState.listEndpoint}`;
  }

  if (savedState.listType === "anime") {
    endpoint = `/discover/tv?with_keywords=210024&sort_by=popularity.desc`;
  }

  fetchList(endpoint, savedState.listType === "movie" ? "movie" : "tv")
    .then(renderSearchResults);
}

  // 6. Restaurar scroll
  if (savedState?.scrollY) {
    setTimeout(() => {
      window.scrollTo({
        top: savedState.scrollY,
        behavior: "auto"
      });
    }, 500);
  }
})();


/* =====================
   MOBILE MENU
===================== */
const menuToggle = document.getElementById("menuToggle");
const mobileMenu = document.getElementById("mobileMenu");
const closeMenu = document.getElementById("closeMenu");

menuToggle?.addEventListener("click", () => {
  mobileMenu.classList.add("open");
});

closeMenu?.addEventListener("click", () => {
  mobileMenu.classList.remove("open");
});



/* =====================
   MOBILE FILTER FIX
===================== */

document.querySelectorAll(".mobile-link[data-filter]").forEach(btn => {
  btn.addEventListener("click", () => {
    const filter = btn.dataset.filter;

    // actualizar filtro global
    activeSearchFilter = filter;

    // cerrar menú móvil
    mobileMenu.classList.remove("open");

    // limpiar búsqueda
    if (searchInput) {
      searchInput.value = "";
    }

    isSearching = false;

    // mostrar home
    homeSection.style.display = "block";
    moviesGrid.style.display = "none";

    // aplicar filtro visual
    filterHomeSections(filter);

    // actualizar botones desktop (por coherencia)
    document.querySelectorAll(".nav-filter").forEach(b => {
      b.classList.toggle("active", b.dataset.filter === filter);
    });

    // scroll suave a sección correcta
    let targetId = null;
    if (filter === "movie") targetId = "movies-section";
    if (filter === "series") targetId = "series-section";
    if (filter === "anime") targetId = "anime-section";

    if (targetId) {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }

    // guardar estado
    saveState({
      filter,
      scrollY: 0,
      search: ""
    });
  });
});
