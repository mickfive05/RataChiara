// CookieYes documented consent events; fail closed if the CMP is unavailable.
(() => {
 const id = 'G-C3XJEK0GNB';
 let enabled = false, loaded = false;
 window.dataLayer = window.dataLayer || [];
 function push() { window.dataLayer.push(arguments); }
 window.gtag = (...args) => { if (enabled || args[0] !== 'event') push(...args); };
 window['ga-disable-' + id] = true;
 push('consent', 'default', {analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
 function update(accepted) {
  enabled = accepted === true;
  window['ga-disable-' + id] = !enabled;
  push('consent', 'update', {analytics_storage:enabled ? 'granted' : 'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  if (!enabled || loaded) return;
  loaded = true;
  push('js', new Date());
  // Shared simulations can carry financial values: never include the query in page views.
  let referrer = '';
  try { const u = new URL(document.referrer); referrer = u.origin + u.pathname; } catch {}
  push('config', id, {page_location:location.origin + location.pathname,page_referrer:referrer,allow_google_signals:false,allow_ad_personalization_signals:false});
  const script = document.createElement('script'); script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
  document.head.append(script);
 }
 document.addEventListener('cookieyes_banner_load', e => update(e.detail?.categories?.analytics === true));
 document.addEventListener('cookieyes_consent_update', e => update(e.detail?.accepted?.includes('analytics') === true));
})();
