import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptBR from '@/locales/pt-BR.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'pt-BR': { translation: ptBR },
    },
    lng: 'pt-BR',
    fallbackLng: 'pt-BR',
    interpolation: {
      escapeValue: false, // React already protects against XSS
    },
    react: {
      useSuspense: false, // Avoid Suspense boundary issues with lazy-loaded pages
    },
  });

export default i18n;
