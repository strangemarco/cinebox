import { TMDB_API_KEY, TMDB_BASE, IMG_BASE } from "./config.js";

/* =====================
   HELPERS
===================== */
function getQueryParam(param) {
  return new URLSearchParams(window.location.search).get(param);
}

function ratingStars(rating10 = 0) {
  const r5 = Math.round((rating10 / 2) * 10) / 10;
  const full = Math.floor(r5);
  const half = r5 - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;

  return `${"★".repeat(full)}${half ? "⯪" : ""}${"☆".repeat(empty)} (${r5}/5)`;
}

async function tmdbFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("TMDB error");
  return res.json();
}

/* =====================
   ELEMENTS
===================== */
const id = getQueryParam("id");
const type = getQueryParam("type"); // movie | tv

const poster = document.getElementById("poster");
const title = document.getElementById("title");
const rating = document.getElementById("rating");
const meta = document.getElementById("meta");
const overview = document.getElementById("overview");
const trailerBtn = document.getElementById("trailerBtn");
const trailerContainer = document.getElementById("trailerContainer");
const trailerIframe = document.getElementById("trailerIframe");

/* =====================
   LOAD DETAIL
===================== */
async function loadDetail() {
  // 🔹 Español
  let data = await tmdbFetch(
    `${TMDB_BASE}/${type}/${id}?api_key=${TMDB_API_KEY}&language=es-ES`
  );

  // 🔁 Fallback a inglés si no hay descripción
  if (!data.overview) {
    const fallback = await tmdbFetch(
      `${TMDB_BASE}/${type}/${id}?api_key=${TMDB_API_KEY}&language=en-US`
    );
    data.overview = fallback.overview;
  }

  poster.src = data.poster_path
    ? IMG_BASE + data.poster_path
    : "https://via.placeholder.com/300x450";

  title.textContent = data.title || data.name;
  rating.innerHTML = ratingStars(data.vote_average);

  const genres = (data.genres || []).map(g => g.name).join(", ");
  const runtime =
    type === "movie"
      ? `${data.runtime || "—"} min`
      : `${data.number_of_episodes || "—"} episodios`;

  const date = data.release_date || data.first_air_date || "—";

  meta.innerHTML = `
    🎭 ${genres || "—"}<br>
    ⏱ ${runtime}<br>
    📅 ${date}<br>
    🔥 Popularidad: ${Math.round(data.popularity)}
  `;

  overview.textContent = data.overview || "Sin descripción disponible.";

  loadTrailer();
}

/* =====================
   LOAD TRAILER (ES → EN)
===================== */
async function loadTrailer() {
  // 🔹 Español
  let videos = await tmdbFetch(
    `${TMDB_BASE}/${type}/${id}/videos?api_key=${TMDB_API_KEY}&language=es-ES`
  );

  let trailer =
    (videos.results || []).find(v => v.site === "YouTube" && v.type === "Trailer") ||
    (videos.results || []).find(v => v.site === "YouTube");

  // 🔁 Fallback a inglés
  if (!trailer) {
    const fallbackVideos = await tmdbFetch(
      `${TMDB_BASE}/${type}/${id}/videos?api_key=${TMDB_API_KEY}&language=en-US`
    );

    trailer =
      (fallbackVideos.results || []).find(
        v => v.site === "YouTube" && v.type === "Trailer"
      ) ||
      (fallbackVideos.results || []).find(v => v.site === "YouTube");
  }

  if (trailer) {
    trailerBtn.classList.remove("hidden");
    trailerBtn.onclick = () => {
      trailerIframe.src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
      trailerContainer.classList.remove("hidden");
    };
  } else {
    trailerBtn.classList.add("hidden");
  }
}

/* =====================
   INIT
===================== */
loadDetail();




