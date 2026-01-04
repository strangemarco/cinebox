// storage.js
const THEME_KEY = "cinebox_theme";

export function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

export function loadTheme() {
  return localStorage.getItem(THEME_KEY);
}
