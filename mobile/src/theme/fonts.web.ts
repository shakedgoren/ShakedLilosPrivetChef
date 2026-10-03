import { Asset } from 'expo-asset';

/**
 * בדפדפן הגופנים הם WOFF2 שמוזרקים כ-@font-face.
 * לא ממתינים להם · font-display: swap מצייר מיד בגופן המערכת.
 * הדפדפן מוריד רק משקל שמופיע על המסך (אנטון, למשל, רק בהתחברות).
 *
 * ⚠ לא דרך קובץ CSS · Metro עדיין לא מעבד url() מקומי ב-CSS.
 */
const FACE = {
  Assistant_200ExtraLight: require('../../assets/fonts/web/assistant-200.woff2'),
  Assistant_300Light: require('../../assets/fonts/web/assistant-300.woff2'),
  Assistant_400Regular: require('../../assets/fonts/web/assistant-400.woff2'),
  Assistant_500Medium: require('../../assets/fonts/web/assistant-500.woff2'),
  Assistant_600SemiBold: require('../../assets/fonts/web/assistant-600.woff2'),
  Assistant_700Bold: require('../../assets/fonts/web/assistant-700.woff2'),
  Anton_400Regular: require('../../assets/fonts/web/anton-400.woff2'),
  GreatVibes_400Regular: require('../../assets/fonts/web/great-vibes-400.woff2'),
  MaterialSymbolsSubset: require('../../assets/fonts/web/material-symbols-subset.woff2'),
} as const;

function uriOf(mod: number): string {
  const asset = Asset.fromModule(mod);
  return asset.localUri ?? asset.uri;
}

if (typeof document !== 'undefined') {
  const css = (Object.keys(FACE) as (keyof typeof FACE)[])
    .map((family) => {
      const display = family === 'MaterialSymbolsSubset' ? 'block' : 'swap';
      const uri = uriOf(FACE[family]);
      /* טווח משקל · הרכיב גם שולח fontWeight, והמשפחה כבר ייחודית למשקל */
      return `@font-face{font-family:${JSON.stringify(family)};src:url(${JSON.stringify(uri)}) format("woff2");font-weight:100 900;font-style:normal;font-display:${display};}`;
    })
    .join('');
  const el = document.createElement('style');
  el.setAttribute('data-brand-fonts', '1');
  el.textContent = css;
  document.head.appendChild(el);
}

/** ריק · useFonts לא ממתין בדפדפן */
export const FONTS = {} as const;

export { DEFAULT_FAMILY, DISPLAY_FAMILY, SIGNATURE_FAMILY, fontFor } from './fontFamilies';
