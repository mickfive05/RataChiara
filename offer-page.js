import { calculateOfferSimulation } from './offer-calculator.js';
import './theme.js';

const $ = (id) => document.getElementById(id);

const money = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR'
});

const number = new Intl.NumberFormat('it-IT', {
  maximumFractionDigits: 2
});

const fields = {
  price: $('sim-price'),
  downPayment: $('sim-down-payment'),
  months: $('sim-months'),
  tan: $('sim-tan'),
  apr: $('sim-apr'),
  balloon: $('sim-balloon')
};

const event = (name) => window.gtag?.('event', name);

/**
 * Estrae il primo URL http/https presente nel testo.
 *
 * Permette di incollare anche testi condivisi da AutoScout24 come:
 *
 * "Ho trovato questa offerta su AutoScout24:
 * https://www.autoscout24.it/annunci/..."
 *
 * utilizzando automaticamente soltanto il link.
 */
function extractUrlFromText(value) {
  if (typeof value !== 'string') return '';

  let text = value.trim();

  // Converte eventuali escape provenienti da condivisioni/copie
  text = text
    .replace(/\\&/g, '&')
    .replace(/&amp;/g, '&');

  // Cerca il primo URL http/https
  const match = text.match(/https?:\/\/[^\s<>"']+/i);

  if (!match) return '';

  let url = match[0]
    .replace(/[)\],.!?;:'"]+$/g, '')
    .trim();

  try {
    const parsed = new URL(url);

    // Rimuove parametri di tracking comuni
    [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content'
    ].forEach((param) => {
      parsed.searchParams.delete(param);
    });

    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Quando l'utente incolla un testo contenente un URL,
 * mostra immediatamente nel campo soltanto il link.
 */
$('offer-url').addEventListener('paste', (event) => {
  const pastedText = event.clipboardData?.getData('text') || '';
  const extractedUrl = extractUrlFromText(pastedText);

  if (!extractedUrl) return;

  event.preventDefault();

  $('offer-url').value = extractedUrl;

  $('offer-url').dispatchEvent(
    new Event('input', { bubbles: true })
  );
});

function display(id, value, formatter = money.format) {
  $(id).textContent =
    value === null || value === undefined || value === ''
      ? '—'
      : formatter(value);
}

function setIf(field, data) {
  if (data?.value !== null && data?.value !== undefined) {
    fields[field].value = data.value;
  }
}

function applyDefaults() {
  const price = Math.max(0, Number(fields.price.value) || 0);

  fields.downPayment.value = (price * 0.25).toFixed(2);
  fields.months.value = 60;
  fields.tan.value = 7;
  fields.apr.value = '';
  fields.balloon.value = 0;
}

function render() {
  $('sim-months-label').textContent = `${fields.months.value} mesi`;

  const result = calculateOfferSimulation(
    Object.fromEntries(
      Object.entries(fields).map(([key, input]) => [
        key,
        input.value
      ])
    )
  );

  display('result-price', result.price);
  display('result-down-payment', result.downPayment);
  display('result-principal', result.principal);

  display(
    'result-months',
    result.months,
    (value) => `${value} mesi`
  );

  display(
    'result-tan',
    result.tan,
    (value) => `${number.format(value)}%`
  );

  display('result-balloon', result.balloon);

  if (!result.valid) {
    $('result-payment').textContent = '—';
    $('result-helper').textContent = result.reason;

    [
      'result-installments',
      'result-total'
    ].forEach((id) => {
      $(id).textContent = '—';
    });

    return;
  }

  $('result-payment').textContent = money.format(result.payment);

  $('result-helper').textContent =
    'Stima aggiornata in base ai parametri inseriti.';

  display(
    'result-installments',
    result.totalInstallments
  );

  display(
    'result-total',
    result.totalSimulated
  );
}

function manualMode() {
  $('offer-error').hidden = true;
  $('offer-workspace').hidden = false;

  $('vehicle-name').textContent =
    'Inserisci i dati dell’auto';

  $('vehicle-price').textContent =
    'Simulazione manuale';

  $('vehicle-detail').textContent =
    'Compila prezzo e modifica i parametri proposti se necessario.';

  fields.price.value = '';

  applyDefaults();

  event('manual_mode_opened');

  render();

  $('sim-price').focus();
}

function showOffer(data) {
  const { vehicle } = data;

  $('offer-workspace').hidden = false;

  $('vehicle-name').textContent =
    vehicle.name?.value || 'Dati dell’auto';

  $('vehicle-price').textContent =
    vehicle.price?.value
      ? money.format(vehicle.price.value)
      : 'Prezzo da verificare';

  $('vehicle-detail').textContent =
    [
      vehicle.year?.value,
      vehicle.fuel?.value
    ]
      .filter(Boolean)
      .join(' · ') ||
    'Controlla il prezzo importato prima di creare la simulazione.';

  if (
    vehicle.image?.value &&
    /^https?:\/\//.test(vehicle.image.value)
  ) {
    const image = new Image();

    image.onload = () => {
      $('vehicle-image').style.backgroundImage =
        `url("${vehicle.image.value}")`;

      $('vehicle-image').textContent = '';
    };

    image.src = vehicle.image.value;
  }

  setIf('price', vehicle.price);

  applyDefaults();

  render();
}

function loading(on) {
  $('offer-loading').hidden = !on;

  $('offer-url-form')
    .querySelector('button')
    .disabled = on;
}

$('offer-url-form').addEventListener(
  'submit',
  async (e) => {
    e.preventDefault();

    /*
     * Ripulisce nuovamente il valore prima della richiesta.
     * In questo modo funziona anche se il testo non è stato
     * inserito tramite un normale evento paste.
     */
    const url = extractUrlFromText(
      $('offer-url').value
    );

    $('offer-url').value = url;

    loading(true);

    $('offer-error').hidden = true;

    event('offer_url_submitted');

    const steps = [
      'Apertura pagina',
      'Ricerca dati veicolo',
      'Ricerca condizioni disponibili',
      'Preparazione simulazione'
    ];

    let index = 0;

    const interval = setInterval(() => {
      index = Math.min(
        index + 1,
        steps.length - 1
      );

      $('loading-step').textContent =
        steps[index];
    }, 850);

    try {
      const response = await fetch(
        '/api/offers/analyze',
        {
          method: 'POST',

          headers: {
            'content-type':
              'application/json'
          },

          body: JSON.stringify({
            url
          })
        }
      );

      const raw = await response.text();

      let payload;

      try {
        payload = raw
          ? JSON.parse(raw)
          : {};
      } catch {
        payload = {};
      }

      if (!response.ok) {
        const message =
          payload.code === 'SOURCE_BLOCKED'
            ? 'Questo sito non consente la lettura automatica dell’annuncio. Inserisci prezzo, durata e TAN manualmente per continuare la simulazione.'
            : (
                payload.error ||
                'Non siamo riusciti a leggere automaticamente questa pagina.'
              );

        throw new Error(message);
      }

      if (!payload.data) {
        throw new Error(
          'Non siamo riusciti a leggere automaticamente questa pagina.'
        );
      }

      showOffer(payload.data);

      event('offer_parse_success');
    } catch (error) {
      $('offer-error-message').textContent =
        error.message ||
        'Inserisci manualmente i dati principali e continua la simulazione.';

      $('offer-error').hidden = false;

      event('offer_parse_failed');
    } finally {
      clearInterval(interval);

      loading(false);
    }
  }
);

fields.price.addEventListener(
  'input',
  () => {
    fields.downPayment.value = (
      Math.max(
        0,
        Number(fields.price.value) || 0
      ) * 0.25
    ).toFixed(2);

    render();

    event('simulation_parameter_changed');
  }
);

Object.entries(fields)
  .filter(([key]) => key !== 'price')
  .forEach(([, input]) => {
    input.addEventListener(
      'input',
      () => {
        render();

        event(
          'simulation_parameter_changed'
        );
      }
    );
  });

$('manual-mode').addEventListener(
  'click',
  manualMode
);

$('error-manual-mode').addEventListener(
  'click',
  manualMode
);

$('current-year').textContent =
  new Date().getFullYear();

render();