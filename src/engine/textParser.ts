import { ItemData } from '../types/game';

declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: (elements?: Element[] | NodeList) => Promise<void>;
    };
  }
}

/**
 * Strips HTML tags from string for clean text matching
 */
export const stripHtml = (html: string): string => {
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]*>?/gm, '');
  }
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

/**
 * Strips TeX/LaTeX wrappers like \ce{}, \ch{}, \text{}, $$, \( \) recursively
 */
export const cleanTeX = (str: string): string => {
  if (typeof str !== 'string') return str;
  let s = str;

  while (true) {
    let changed = false;
    if (s.startsWith('$$') && s.endsWith('$$')) {
      s = s.substring(2, s.length - 2);
      changed = true;
    }
    if (s.startsWith('\\ce{') && s.endsWith('}')) {
      s = s.substring(4, s.length - 1);
      changed = true;
    }
    if (s.startsWith('\\ch{') && s.endsWith('}')) {
      s = s.substring(4, s.length - 1);
      changed = true;
    }
    if (s.startsWith('\\text{') && s.endsWith('}')) {
      s = s.substring(6, s.length - 1);
      changed = true;
    }
    if (s.startsWith('\\(') && s.endsWith('\\)')) {
      s = s.substring(2, s.length - 2);
      changed = true;
    }

    if (!changed) {
      const oldS = s;
      s = s.replace(/\\(ce|ch|text)\{|\}|\$|_|\^|\\\("|\\\)/g, '');
      if (s !== oldS) changed = true;
    }

    if (!changed) break;
  }
  return s;
};

/**
 * Helper for numeric answer tolerance check
 */
export const checkNumericAnswer = (
  input: string,
  correct: string | number,
  tolerancePercent = 0.05
): boolean => {
  const userNum = Number(input.trim());
  const correctNum = Number(correct);
  if (!isNaN(userNum) && !isNaN(correctNum)) {
    const tolerance = Math.abs(correctNum * tolerancePercent);
    return Math.abs(userNum - correctNum) <= tolerance;
  }
  return false;
};

/**
 * Generalized Item Finder
 */
export const findItem = (itemsData: ItemData[], query: string): ItemData | null => {
  if (!itemsData || !itemsData.length) return null;
  const q = query.trim().toLowerCase();
  const cleanQuery = cleanTeX(q);

  const exact = itemsData.find(i => {
    const id = i.id.toLowerCase();
    const name = stripHtml(i.name).toLowerCase();
    return id === q || name === q || cleanTeX(id) === cleanQuery;
  });

  if (exact) return exact;

  return (
    itemsData.find(i => {
      const id = i.id.toLowerCase();
      const name = stripHtml(i.name).toLowerCase();
      return id.includes(q) || name.includes(q) || cleanTeX(id).includes(cleanQuery);
    }) || null
  );
};

/**
 * Trigger MathJax rendering if present
 */
export const safeTypeset = (elements?: Element[] | NodeList): void => {
  if (typeof window !== 'undefined' && window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise(elements).catch(err =>
      console.log('MathJax typeset error:', err)
    );
  }
};
