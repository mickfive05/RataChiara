const THEME_KEY = 'ratachiara-theme-v2';
const systemThemeQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
const toggle = document.querySelector('[data-theme-toggle]');

function readSavedTheme() {
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    return saved === 'dark' || saved === 'light' ? saved : null;
  } catch {
    return null;
  }
}

function systemTheme() {
  return systemThemeQuery?.matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  const dark = theme === 'dark';
  const root = document.documentElement;

  root.dataset.theme = dark ? 'dark' : 'light';
  root.style.colorScheme = dark ? 'dark' : 'light';

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', dark ? '#101817' : '#0c2d2a');

  if (!toggle) return;

  toggle.setAttribute('aria-pressed', String(dark));
  toggle.setAttribute('aria-label', dark ? 'Attiva tema chiaro' : 'Attiva tema scuro');

  const label = toggle.querySelector('.theme-toggle-label');
  if (label) label.textContent = dark ? 'Tema chiaro' : 'Tema scuro';
}

let manualTheme = readSavedTheme();
applyTheme(manualTheme || systemTheme());

// Se l'utente non ha scelto manualmente un tema, RataChiara segue il dispositivo
// anche quando la preferenza di sistema cambia mentre la pagina e aperta.
systemThemeQuery?.addEventListener?.('change', () => {
  if (!manualTheme) applyTheme(systemTheme());
});

toggle?.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  manualTheme = nextTheme;
  applyTheme(nextTheme);

  try {
    window.localStorage.setItem(THEME_KEY, nextTheme);
  } catch {
    // Se lo storage non e disponibile, la scelta resta valida per la pagina corrente.
  }
});


function ensureLegalFooterStyles() {
  if (document.getElementById('ratachiara-legal-footer-styles')) return;

  const style = document.createElement('style');
  style.id = 'ratachiara-legal-footer-styles';
  style.textContent = `
    .footer-legal-group {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 14px;
      flex-wrap: wrap;
    }
    .legal-footer-links {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .legal-footer-links a {
      color: inherit;
      font-weight: 750;
      text-decoration: none;
      transition: color 150ms ease;
    }
    .legal-footer-links a:hover { color: #fff; }
    @media (max-width: 850px) {
      .footer-legal-group {
        align-items: flex-start;
        justify-content: flex-start;
        flex-direction: column;
        gap: 8px;
      }
    }
  `;
  document.head.append(style);
}

function ensureLegalFooterLinks() {
  const footerBottom = document.querySelector('footer .footer-bottom');
  if (!footerBottom || footerBottom.querySelector('.legal-footer-links')) return;

  let group = footerBottom.querySelector('.footer-legal-group');

  if (!group) {
    group = document.createElement('div');
    group.className = 'footer-legal-group';

    const disclaimer = Array.from(footerBottom.children).find(
      (element) => element.tagName === 'SPAN' && element.textContent.includes('Calcolo informativo')
    );

    if (disclaimer) {
      footerBottom.insertBefore(group, disclaimer);
      group.append(disclaimer);
    } else {
      footerBottom.append(group);
    }
  }

  const nav = document.createElement('nav');
  nav.className = 'legal-footer-links';
  nav.setAttribute('aria-label', 'Informazioni legali');
  nav.innerHTML = `
    <a href="legal.html#privacy">Privacy</a>
    <a href="legal.html#disclaimer">Disclaimer</a>
    <a href="legal.html#termini">Termini</a>
  `;

  group.append(nav);
}

ensureLegalFooterStyles();
ensureLegalFooterLinks();
