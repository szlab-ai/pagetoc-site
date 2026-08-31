import { ui, defaultLang, type Lang } from './ui';
export function useTranslations(lang: Lang) {
  return function t(key: keyof typeof ui['en']): string {
    return (ui[lang] as any)[key] ?? (ui[defaultLang] as any)[key];
  };
}
