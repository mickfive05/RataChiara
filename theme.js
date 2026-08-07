const THEME_KEY = 'ratachiara-theme';
const toggle = document.querySelector('[data-theme-toggle]');

function applyTheme(theme) {
  const dark = theme === 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#101817' : '#0c2d2a');
  if (!toggle) return;
  toggle.setAttribute('aria-pressed', String(dark));
  toggle.setAttribute('aria-label', dark ? 'Attiva tema chiaro' : 'Attiva tema scuro');
  toggle.querySelector('.theme-toggle-label').textContent = dark ? 'Tema chiaro' : 'Tema scuro';
}

let savedTheme = 'light';
try { savedTheme = window.localStorage.getItem(THEME_KEY) || 'light'; } catch { /* browser storage unavailable */ }
applyTheme(savedTheme);
toggle?.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  try { window.localStorage.setItem(THEME_KEY, nextTheme); } catch { /* keep it for this visit */ }
});
