# 🎬 CineBox

CineBox es una aplicación web para explorar películas, series y anime, construida como proyecto personal de portafolio.  
Consume la API de **TMDB** y ofrece una experiencia moderna, rápida y responsive, inspirada en plataformas de streaming.

---

## 🚀 Características principales

- 🔥 Exploración de contenido en tendencia
- 🎬 Películas, 📺 Series y 🎌 Anime
- 🔎 Búsqueda dinámica en tiempo real
- 🎚 Filtros por tipo de contenido
- 🧠 Persistencia de estado con **LocalStorage**
- 🌙 Modo oscuro / claro
- 📱 UX optimizada para **dispositivos móviles**
- 🧭 Navegación fluida sin recargas

---

## 🧠 Manejo de estado (LocalStorage)

La aplicación guarda automáticamente:

- Filtro activo (Películas / Series / Anime)
- Posición del scroll
- Texto de búsqueda
- Vista actual (home / search / list)
- Tema seleccionado (claro / oscuro)

Esto permite que, al recargar la página o volver desde el detalle, el usuario continúe exactamente donde estaba.

---

## 📱 Diseño Responsive (UX Mobile)

- Navbar adaptativo para desktop y mobile
- Menú hamburguesa en versión móvil
- Navegación tipo *drawer* inspirada en plataformas de streaming
- Botones grandes y accesibles
- Mantiene visibles:
  - Botón de Discord
  - Cambio de tema
  - Barra de búsqueda

---

## 🎨 Interfaz y experiencia de usuario

- Animaciones suaves
- Carruseles horizontales
- Etiquetas visuales (Movie / Series / Anime)
- Scroll restaurado automáticamente
- Diseño limpio y oscuro orientado a contenido

---

## 🛠 Tecnologías utilizadas

- **HTML5**
- **CSS3**
- **JavaScript (ES Modules)**
- **TMDB API**
- **LocalStorage**
- **Responsive Design**

---

## 📂 Estructura del proyecto

cinebox/
│
├── index.html
├── about.html
├── detail.html
│
├── styles.css
├── script.js
├── state.js
├── storage.js
├── config.js
│
└── README.md



---

## 🔑 API

Este proyecto utiliza la API pública de **The Movie Database (TMDB)**.

> Para usar el proyecto localmente necesitas una API Key de TMDB  
> https://www.themoviedb.org/

La clave se configura en:

```js
// config.js
//export const TMDB_API_KEY = "TU_API_KEY";




🌐 Demo
https://strangemarco.github.io/cinebox/


📌 Estado del proyecto

✔ Funcional
✔ Optimizado para mobile
✔ En constante mejora

👤 Autor

Marco Justiniano
Proyecto personal de portafolio
Santa Cruz, Bolivia 🇧🇴

⭐ Nota

Este proyecto fue desarrollado con fines educativos y de portafolio.
No aloja contenido, solo consume información pública desde la API de TMDB.
