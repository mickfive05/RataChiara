const THEME_KEY = 'ratalab-theme-v2';
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

// Se l'utente non ha scelto manualmente un tema, RataLab segue il dispositivo
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
  if (document.getElementById('ratalab-legal-footer-styles')) return;

  const style = document.createElement('style');
  style.id = 'ratalab-legal-footer-styles';
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

function organizeMainNavigation() {
  const nav = document.querySelector('.topbar nav');
  if (!nav) return;

  const page = window.location.pathname.split('/').pop() || 'index.html';
  const current = (name) => page === name ? ' aria-current="page"' : '';
  const secondaryPages = ['confrontare-due-finanziamenti.html', 'rata-reddito.html', 'tan-vs-taeg.html', 'maxi-rata-finale.html'];
  const secondaryOpen = secondaryPages.includes(page);

  nav.innerHTML = `
    <a href="index.html#calcolatore"${page === 'index.html' ? ' aria-current="page"' : ''}>Calcolatore</a>
    <a href="incolla-offerta.html"${current('incolla-offerta.html')}>Incolla l’offerta</a>
    <a href="controlla-preventivo.html"${current('controlla-preventivo.html')}>Controlla preventivo</a>
    <a href="probabilita-approvazione.html"${current('probabilita-approvazione.html')}>Sostenibilità</a>
    <a href="guide.html"${current('guide.html')}>Guide</a>
    <details class="nav-tools-menu"${secondaryOpen ? ' open' : ''}>
      <summary${secondaryOpen ? ' aria-current="page"' : ''}>Altri strumenti <span aria-hidden="true">⌄</span></summary>
      <div class="nav-tools-panel">
        <a href="confrontare-due-finanziamenti.html"${current('confrontare-due-finanziamenti.html')}>Confronta finanziamenti</a>
        <a href="rata-reddito.html"${current('rata-reddito.html')}>Rata e reddito</a>
        <a href="tan-vs-taeg.html"${current('tan-vs-taeg.html')}>TAN e TAEG</a>
        <a href="maxi-rata-finale.html"${current('maxi-rata-finale.html')}>Maxi-rata finale</a>
      </div>
    </details>
    <a href="per-aziende.html"${current('per-aziende.html')}>Per aziende</a>
  `;
}

organizeMainNavigation();

function addMobileMenu() {
  const topbar = document.querySelector('.topbar');
  const nav = topbar?.querySelector('nav');
  if (!topbar || !nav || document.querySelector('.mobile-menu-toggle')) return;

  const toggleMenu = document.createElement('button');
  toggleMenu.className = 'mobile-menu-toggle';
  toggleMenu.type = 'button';
  toggleMenu.setAttribute('aria-label', 'Apri il menu');
  toggleMenu.setAttribute('aria-expanded', 'false');
  toggleMenu.innerHTML = '<span></span><span></span><span></span>';

  const menu = document.createElement('aside');
  menu.className = 'mobile-menu';
  menu.setAttribute('aria-label', 'Navigazione mobile');
  menu.innerHTML = `<div class="mobile-menu-top"><span>Menu</span><button type="button" aria-label="Chiudi il menu">×</button></div>`;
  menu.append(nav.cloneNode(true));

  const scrim = document.createElement('div');
  scrim.className = 'mobile-menu-scrim';
  document.body.append(scrim, menu);
  topbar.insertBefore(toggleMenu, topbar.querySelector('.theme-toggle'));

  const setOpen = (open) => {
    document.documentElement.classList.toggle('mobile-menu-open', open);
    toggleMenu.setAttribute('aria-expanded', String(open));
    toggleMenu.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
  };

  toggleMenu.addEventListener('click', () => setOpen(!document.documentElement.classList.contains('mobile-menu-open')));
  menu.querySelector('.mobile-menu-top button').addEventListener('click', () => setOpen(false));
  scrim.addEventListener('click', () => setOpen(false));
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
}

addMobileMenu();

// The dealership shown on the business page has an independent preview theme.
const dealerPreview = document.querySelector('.dealer-browser');
if (dealerPreview) {
  const dealerToolbar = dealerPreview.querySelector('.browser-chrome');
  const dealerToggle = document.createElement('button');
  dealerToggle.className = 'dealer-theme-toggle';
  dealerToggle.type = 'button';
  dealerToggle.setAttribute('aria-pressed', 'false');
  dealerToolbar?.append(dealerToggle);

  const applyDealerTheme = (theme) => {
    const dark = theme === 'dark';
    dealerPreview.dataset.dealerTheme = theme;
    dealerToggle.setAttribute('aria-pressed', String(dark));
    dealerToggle.textContent = dark ? '☀ Tema chiaro' : '◐ Tema scuro';
  };

  dealerToggle.addEventListener('click', () => {
    applyDealerTheme(dealerPreview.dataset.dealerTheme === 'dark' ? 'light' : 'dark');
  });

  applyDealerTheme('light');

  const widget = dealerPreview.querySelector('.embedded-widget');
  if (widget && !widget.querySelector('.widget-demo-button')) {
    const widgetTitle = widget.querySelector('h3');
    if (widgetTitle) widgetTitle.textContent = 'Simula la tua rata';

    const demoButton = document.createElement('button');
    demoButton.className = 'widget-demo-button';
    demoButton.type = 'button';
    demoButton.setAttribute('aria-disabled', 'true');
    demoButton.textContent = 'Visualizza meglio su RataLab';
    widget.append(demoButton);
  }
}
