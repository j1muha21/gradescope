/**
 * lib/LangContext.js
 * ─────────────────────────────────────────────────────────────────────────────
 * React Context that provides structured JSON translations to all React pages.
 *
 * Usage inside any component:
 *   import { useLang } from '../lib/LangContext';
 *   const { t, lang, setLang } = useLang();
 *   <h1>{t('tool.title')}</h1>
 *
 * Interpolation:
 *   t('gpa.cumPrevLine', { gpa: '3.45', cr: '60' })
 *   → "Previous: 3.45 GPA over 60 credits"
 *
 * Architecture:
 *   - All 8 locale JSON files are imported at build time (Next.js bundles them).
 *   - Language preference persists in localStorage under 'gs_lang'.
 *   - When language changes, window.GS_setLanguage is also notified so that
 *     DOM-based pages (index, about, contact) using i18n.js stay in sync.
 *   - RTL direction is applied to <html dir="…"> for Arabic.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

import en from '../locales/en.json';
import de from '../locales/de.json';
import fr from '../locales/fr.json';
import es from '../locales/es.json';
import ar from '../locales/ar.json';
import zh from '../locales/zh.json';
import pt from '../locales/pt.json';
import tr from '../locales/tr.json';

const LOCALES = { en, de, fr, es, ar, zh, pt, tr };

export const LANGS = [
  { code: 'en', flag: '🇬🇧', label: 'English',   short: 'EN' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch',   short: 'DE' },
  { code: 'fr', flag: '🇫🇷', label: 'Français',  short: 'FR' },
  { code: 'es', flag: '🇪🇸', label: 'Español',   short: 'ES' },
  { code: 'ar', flag: '🇦🇪', label: 'العربية',   short: 'AR' },
  { code: 'zh', flag: '🇨🇳', label: '中文',       short: 'ZH' },
  { code: 'pt', flag: '🇵🇹', label: 'Português', short: 'PT' },
  { code: 'tr', flag: '🇹🇷', label: 'Türkçe',    short: 'TR' },
];

// ── Context ───────────────────────────────────────────────────────────────────
const LangContext = createContext(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function LangProvider({ children }) {
  const [lang, setLangState] = useState('en');

  // Hydrate from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gs_lang');
      if (saved && LOCALES[saved]) setLangState(saved);
    } catch (_) {}
  }, []);

  // Apply RTL and sync the DOM-based i18n.js bridge whenever language changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    }
    if (typeof window !== 'undefined' && window.GS_setLanguage) {
      window.GS_setLanguage(lang, null);
    }
  }, [lang]);

  const setLang = useCallback((code) => {
    if (!LOCALES[code]) return;
    setLangState(code);
    try { localStorage.setItem('gs_lang', code); } catch (_) {}
  }, []);

  /**
   * t(key, vars?)
   * Looks up a translation key. Falls back to English, then the key itself.
   * Interpolates {placeholder} tokens from the vars object.
   */
  const t = useCallback((key, vars) => {
    const dict = LOCALES[lang] || LOCALES.en;
    let text = dict[key] ?? LOCALES.en[key] ?? key;
    if (vars && typeof text === 'string') {
      text = text.replace(/\{(\w+)\}/g, (_, k) =>
        vars[k] !== undefined ? vars[k] : `{${k}}`
      );
    }
    return text;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t, langs: LANGS }}>
      {children}
    </LangContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang() must be used inside <LangProvider>');
  return ctx;
}
