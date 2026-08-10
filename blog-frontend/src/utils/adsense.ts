const client = import.meta.env.VITE_ADSENSE_CLIENT;

export function loadAdSense() {
  if (!client || typeof document === 'undefined') return;
  if (document.querySelector('script[data-adsense]')) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
  script.crossOrigin = 'anonymous';
  script.dataset.adsense = 'true';
  document.head.appendChild(script);
}

export function adsenseConfigured() {
  return Boolean(import.meta.env.VITE_ADSENSE_CLIENT && import.meta.env.VITE_ADSENSE_SLOT);
}
