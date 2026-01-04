import { saveTheme, loadTheme } from "./storage.js";

const themeBtn = document.getElementById("themeToggle");

// aplicar tema guardado al cargar
const savedTheme = loadTheme();
if (savedTheme === "light") {
  document.body.classList.add("light");
  if (themeBtn) themeBtn.textContent = "🌞";
} else {
  document.body.classList.remove("light");
  if (themeBtn) themeBtn.textContent = "🌙";
}

// toggle de tema
themeBtn?.addEventListener("click", () => {
  document.body.classList.toggle("light");

  const isLight = document.body.classList.contains("light");
  saveTheme(isLight ? "light" : "dark");

  themeBtn.textContent = isLight ? "🌞" : "🌙";
});
