import { ItemData, NarrativeNode } from '../types/game';

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

/**
 * Splits text on '--' into separate HTML block strings, handling 'interrupt' headers
 */
/**
 * Splits text on '--' into separate HTML block strings, stripping <ol>/<ul> choice lists and instructions
 */
export const parseDivChunks = (text: string): string[] => {
  if (!text) return [];
  // First strip script tags if present
  let clean = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');

  // Strip <ol>, <ul>, and <li> tags completely from narration display text
  clean = clean
    .replace(/<ol\b[^>]*>[\s\S]*?<\/ol>/gi, '')
    .replace(/<ul\b[^>]*>[\s\S]*?<\/ul>/gi, '')
    .replace(/<li\b[^>]*>[\s\S]*?<\/li>/gi, '')
    .replace(/\([^)]*type the number[^)]*\)/gi, '')
    .replace(/\([^)]*type your answer[^)]*\)/gi, '');

  const rawParts = clean.split('--');
  const filtered = rawParts
    .map(p => p.trim())
    .filter(p => p !== '' && p !== 'interrupt' && !/^<ol\b/i.test(p) && !/^<ul\b/i.test(p));
  return filtered;
};

export interface ScriptHandlers {
  changeHP?: (delta: number) => void;
  setHP?: (hp: number) => void;
  setHPLossRate?: (rate: number) => void;
  modifyStat?: (statName: string, deltaOrValue: number, isRelative: boolean) => void;
  pickup?: (itemName: string) => void;
  removeInventory?: (itemName: string, qty?: string | number) => void;
  setLab?: (labName: string) => void;
  setLabVisible?: (visible: boolean) => void;
  setMachineOn?: (on: boolean) => void;
  roll?: (diceType: string, statName?: string, dc?: number, advantage?: boolean) => void;
}

/**
 * Parses roll string like roll("1d20", "DEX", 31, false) and executes roll
 */
export const parseAndExecuteRoll = <T>(
  rollStr: string,
  rollDiceFn: (diceType: string, statName?: any, dc?: number, advantage?: boolean | null) => T
): T | null => {
  if (!rollStr) return null;

  const match = rollStr.match(
    /roll\s*\(\s*["']?([^"',\s]+)["']?\s*(?:,\s*["']?([^"',\s]+)["']?)?\s*(?:,\s*(\d+))?\s*(?:,\s*(true|false))?\s*\)/i
  );
  if (!match) return null;

  const diceType = match[1] || '1d20';
  const statName = match[2];
  const dc = match[3] ? parseInt(match[3], 10) : undefined;
  const advantage = match[4] ? match[4].toLowerCase() === 'true' : undefined;

  return rollDiceFn(diceType, statName, dc, advantage);
};

/**
 * Extracts and executes embedded <script> tags from narration text and returns clean display text
 */
export const processTextScripts = (
  rawText: string,
  handlers?: ScriptHandlers
): { cleanText: string } => {
  if (!rawText) return { cleanText: '' };

  // Normalize malformed <script>...<script> tags to <script>...</script>
  const normalizedText = rawText.replace(/<script\b[^>]*>([\s\S]*?)<script>/gi, '<script>$1</script>');
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptRegex.exec(normalizedText)) !== null) {
    const scriptCode = match[1];
    try {
      let hpLossVal = 0;
      let playerHPVal = 100;
      let currentLabVal = '';
      let machineOnVal = false;

      const scope: Record<string, any> = {
        get HPloss() {
          return hpLossVal;
        },
        set HPloss(v: number) {
          hpLossVal = v;
          handlers?.setHPLossRate?.(v);
        },

        get playerHP() {
          return playerHPVal;
        },
        set playerHP(v: number) {
          playerHPVal = v;
          handlers?.setHP?.(v);
        },
        maxHP: 100,

        get machineon() {
          return machineOnVal;
        },
        set machineon(v: boolean) {
          machineOnVal = v;
          handlers?.setMachineOn?.(v);
        },

        get currentlab() {
          return currentLabVal;
        },
        set currentlab(v: string) {
          currentLabVal = String(v);
          if (v) handlers?.setLab?.(String(v));
        },

        get currentLab() {
          return currentLabVal;
        },
        set currentLab(v: string) {
          currentLabVal = String(v);
          if (v) handlers?.setLab?.(String(v));
        },

        // Stat getters & setters for DEX, CON, STR, INT, WIS, CHA
        get STR() { return 10; },
        set STR(v: number) { handlers?.modifyStat?.('STR', v, false); },
        get DEX() { return 10; },
        set DEX(v: number) { handlers?.modifyStat?.('DEX', v, false); },
        get CON() { return 10; },
        set CON(v: number) { handlers?.modifyStat?.('CON', v, false); },
        get INT() { return 10; },
        set INT(v: number) { handlers?.modifyStat?.('INT', v, false); },
        get WIS() { return 10; },
        set WIS(v: number) { handlers?.modifyStat?.('WIS', v, false); },
        get CHA() { return 10; },
        set CHA(v: number) { handlers?.modifyStat?.('CHA', v, false); },

        // In-game functions called in narration scripts
        changeHP: (delta: number) => handlers?.changeHP?.(delta),
        pickup: (item: string) => handlers?.pickup?.(item),
        removeInventory: (item: string, qty?: string | number) => handlers?.removeInventory?.(item, qty),
        closelab: () => handlers?.setLabVisible?.(false),
        launch: (lab?: string) => {
          const target = lab || currentLabVal;
          if (target) handlers?.setLab?.(target);
          handlers?.setLabVisible?.(true);
        },
        roll: (diceType: string, statName?: string, dc?: number, advantage?: boolean) => {
          handlers?.roll?.(diceType, statName, dc, advantage);
        },
      };

      // Support window.currentlab, window.STR, window.STR-=5
      const windowProxy = new Proxy(typeof window !== 'undefined' ? window : {}, {
        get(target, prop: string) {
          if (prop in scope) {
            return (scope as any)[prop];
          }
          return (target as any)[prop];
        },
        set(target, prop: string, value: any) {
          if (prop in scope) {
            (scope as any)[prop] = value;
            return true;
          }
          (target as any)[prop] = value;
          return true;
        },
      });

      scope.window = windowProxy;

      // Use with(scope) block so property assignments call scope setters
      const fn = new Function('scope', `with (scope) {\n${scriptCode}\n}`);
      fn(scope);
    } catch (err) {
      console.warn('Embedded script execution warning:', err, scriptCode);
    }
  }

  const cleanText = rawText.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  return { cleanText };
};

/**
 * Executes an item script like "changeHP(-20)" or "DEX+=5; CON+=5;"
 */
export const executeItemScript = (
  scriptCode: string,
  handlers?: ScriptHandlers
): void => {
  if (!scriptCode) return;
  processTextScripts(`<script>${scriptCode}</script>`, handlers);
};

/**
 * Helper to capitalize option titles when falling back to raw op1..op4 keys
 */
const formatOptionTitle = (str: string): string => {
  if (!str) return '';
  const clean = str.trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

/**
 * Extracts MCQ options and strips <ol> lists or instructions from node narrative text
 */
export const extractOptionsAndCleanText = (
  node?: NarrativeNode
): { cleanText: string; choices: { num: number; text: string; targetNodeId?: string }[] } => {
  if (!node || !node.text) return { cleanText: '', choices: [] };

  let text = node.text;
  const choices: { num: number; text: string; targetNodeId?: string }[] = [];

  // 1. Extract <ol><li>...</li></ol> or <ul><li>...</li></ul> list items first for exact titles
  const liMatches = text.match(/<li\b[^>]*>([\s\S]*?)<\/li>/gi);
  if (liMatches && liMatches.length > 0) {
    liMatches.forEach((liHtml, idx) => {
      const itemText = liHtml.replace(/<[^>]*>?/gm, '').trim();
      if (itemText) {
        const opKey = `op${idx + 1}` as keyof NarrativeNode;
        const targetNodeId = (node[opKey] as string) || itemText;
        choices.push({
          num: idx + 1,
          text: formatOptionTitle(itemText),
          targetNodeId,
        });
      }
    });
  } else {
    // Fallback to op1..op4 if no HTML list items found
    if (node.op1) choices.push({ num: 1, text: formatOptionTitle(node.op1), targetNodeId: node.op1 });
    if (node.op2) choices.push({ num: 2, text: formatOptionTitle(node.op2), targetNodeId: node.op2 });
    if (node.op3) choices.push({ num: 3, text: formatOptionTitle(node.op3), targetNodeId: node.op3 });
    if (node.op4) choices.push({ num: 4, text: formatOptionTitle(node.op4), targetNodeId: node.op4 });
  }

  // 2. Strip <ol>...</ol>, <ul>...</ul>, <li>...</li>, and instructions from narration text
  const cleanText = text
    .replace(/<ol\b[^>]*>[\s\S]*?<\/ol>/gi, '')
    .replace(/<ul\b[^>]*>[\s\S]*?<\/ul>/gi, '')
    .replace(/<li\b[^>]*>[\s\S]*?<\/li>/gi, '')
    .replace(/\([^)]*type the number[^)]*\)/gi, '')
    .replace(/\([^)]*type your answer[^)]*\)/gi, '')
    .trim();

  return { cleanText, choices };
};


