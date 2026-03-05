const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string;

if (!RECAPTCHA_SITE_KEY) {
  throw new Error("VITE_RECAPTCHA_SITE_KEY não está definida. Configure a variável de ambiente.");
}

let scriptLoaded = false;

export function loadRecaptchaScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();

  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src*="recaptcha"]`)) {
      scriptLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load reCAPTCHA"));
    document.head.appendChild(script);
  });
}

export async function getRecaptchaToken(action: string): Promise<string> {
  await loadRecaptchaScript();

  return new Promise((resolve, reject) => {
    (window as any).grecaptcha.ready(() => {
      (window as any).grecaptcha
        .execute(RECAPTCHA_SITE_KEY, { action })
        .then((token: string) => resolve(token))
        .catch((err: Error) => reject(err));
    });
  });
}
