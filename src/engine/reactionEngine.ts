import { ItemData, LabData, FlaskInput, FlaskReactionState } from '../types/game';
import { cleanTeX, stripHtml } from './textParser';

/**
 * Faithful port of the original game.js lab reaction engine (getFlaskState & friends).
 * Where the original relied on `window.currentLabData` / `window.itemsData` globals,
 * this module takes `labData` (the active lab's row from data.json `labs`) and
 * `itemsData` explicitly.
 */

const idOf = (item: FlaskInput): string | number =>
  typeof item === 'object' && item !== null ? item.id : item;

const qtyOf = (item: FlaskInput): number =>
  typeof item === 'object' && item !== null && item.qty !== undefined ? item.qty! : 1.0;

const parseAttrString = (raw: any): any => {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try {
    const sanitized = String(raw).replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
    return JSON.parse(sanitized);
  } catch (e) {
    return null;
  }
};

interface CachedReactionData {
  labid: string;
  reactionStr: string;
  itemsDataRef: ItemData[];
  reactionData: any;
  reactionKeys: string[];
}
let reactionDataCache: CachedReactionData | null = null;

/**
 * Parses `labData.reaction` and merges missing product attributes from `itemsData`,
 * memoized since this work is independent of the current flask contents but
 * getFlaskState is called repeatedly (up to 3x per chain tick) with the same labData.
 */
const getParsedReactionData = (labData: LabData, itemsData: ItemData[]): CachedReactionData | null => {
  if (
    reactionDataCache &&
    reactionDataCache.labid === labData.labid &&
    reactionDataCache.reactionStr === labData.reaction &&
    reactionDataCache.itemsDataRef === itemsData
  ) {
    return reactionDataCache;
  }

  const reactionData = parseAttrString(labData.reaction);
  if (!reactionData) return null;

  // Merge missing attributes from itemsData into every product definition
  Object.values(reactionData).forEach((out: any) => {
    const outArr = Array.isArray(out) ? out : [out];
    outArr.forEach((prod: any) => {
      if (prod && prod.id) {
        const cleanId = cleanTeX(prod.id);
        const cleanName = stripHtml(prod.id);
        const itemDef = itemsData.find(i => {
          const iId = i.id;
          const iName = i.name ? stripHtml(i.name) : '';
          return (
            iId === prod.id ||
            iName === prod.id ||
            cleanTeX(iId) === cleanId ||
            iName === cleanName
          );
        });
        if (itemDef && itemDef.attributes) {
          const attr = parseAttrString(itemDef.attributes);
          if (attr) {
            Object.keys(attr).forEach(k => {
              if (prod[k] === undefined) prod[k] = attr[k];
            });
          }
        }
      }
    });
  });

  // Iterate all defined reactions, prioritizing more "complex" keys first
  const reactionKeys = Object.keys(reactionData).sort((a, b) => b.length - a.length);

  reactionDataCache = { labid: labData.labid, reactionStr: labData.reaction!, itemsDataRef: itemsData, reactionData, reactionKeys };
  return reactionDataCache;
};

/**
 * Resolve attributes for either a beaker index (number, or numeric-string "1".."4")
 * or an item/product id, checking Inventory items first, then the active lab's beakers.
 */
export const getAttributes = (
  id: string | number,
  labData: LabData | undefined,
  itemsData: ItemData[]
): any => {
  // Resolve beaker index -> chemical id first (fixes bars showing "1" instead of "AgNO3")
  let realId: string | number = id;
  if (typeof id === 'number' && labData && labData['beaker' + id]) {
    realId = labData['beaker' + id];
  }
  id = realId;

  let rawStr: any = null;

  if (typeof id === 'number') {
    if (labData && labData['attributes' + id]) {
      rawStr = labData['attributes' + id];
    }
  } else {
    const item = itemsData.find(i => i.id === id);
    if (item && item.attributes) {
      if (typeof item.attributes === 'object') return item.attributes;
      rawStr = item.attributes;
    }

    if (!rawStr && labData) {
      for (let i = 1; i <= 20; i++) {
        if (labData['beaker' + i] === id) {
          if (labData['attributes' + i]) rawStr = labData['attributes' + i];
          break;
        }
      }
    }
  }

  if (rawStr) {
    const parsed = parseAttrString(rawStr);
    if (parsed) return parsed;
  }
  return null;
};

export const getColors = (
  indices: (string | number)[],
  labData: LabData | undefined,
  itemsData: ItemData[]
): string[] => {
  return indices.map(idx => {
    const attr = getAttributes(idx, labData, itemsData);
    return attr && attr.color ? attr.color : 'rgba(255, 255, 255, 0.2)';
  });
};

/** pH of a mixture of raw ids/beaker indices (not FlaskInput objects). */
export const calculateMixPH = (
  indices: (string | number)[],
  labData: LabData | undefined,
  itemsData: ItemData[]
): number | null => {
  if (indices.length === 0) return null;

  let totalH = 0;
  indices.forEach(idx => {
    let ph = 7.0;
    const attr = getAttributes(idx, labData, itemsData);
    if (attr && attr.ph !== undefined) ph = parseFloat(attr.ph);

    const molesH = Math.pow(10, -ph);
    const molesOH = Math.pow(10, -(14 - ph));
    totalH += molesH - molesOH;
  });

  const avgNetH = totalH / indices.length;
  if (avgNetH > 0) {
    return -Math.log10(avgNetH);
  } else if (avgNetH < 0) {
    const pOH = -Math.log10(-avgNetH);
    return 14 - pOH;
  }
  return 7.0;
};

/** Resolve a beaker index or item id to its display id/formula (prefers formula over name). */
export const resolveId = (
  id: string | number,
  labData: LabData | undefined,
  itemsData: ItemData[]
): string | number => {
  if (labData && (typeof id === 'number' || (typeof id === 'string' && /^[1-4]$/.test(id)))) {
    const beakerKey = 'beaker' + id;
    if (labData[beakerKey]) return labData[beakerKey];
  }
  const item = itemsData.find(i => i.id === id);
  if (item) return item.id;
  return id;
};

/** Helper to get physical state symbol (e.g. _{(s)}, _{(l)}, _{(g)}, _{(aq)}) */
export const getPhysicalStateSymbol = (
  id: string | number,
  labData: LabData | undefined,
  itemsData: ItemData[]
): string => {
  let type: string | null = null;
  const item = itemsData.find(i => i.id === id);
  if (item && item.attributes) {
    const attr = parseAttrString(item.attributes);
    if (attr && attr.type) type = attr.type;
  }
  if (labData && (typeof id === 'number' || (typeof id === 'string' && /^[1-4]$/.test(id)))) {
    const attrKey = 'attributes' + id;
    if (labData[attrKey]) {
      const attr = parseAttrString(labData[attrKey]);
      if (attr && attr.type) type = attr.type;
    }
  }
  if (type === 'solid') return '_{(s)}';
  if (type === 'liquid') return '_{(l)}';
  if (type === 'gas' || type === 'trapped_gas') return '_{(g)}';
  if (type === 'aqueous' || type === 'aq') return '_{(aq)}';
  return '';
};

/**
 * Core reaction matcher: given the current flask contents, finds the best-matching
 * reaction defined in the active lab's `reaction` JSON (stoichiometry + optional
 * equilibrium), or falls back to a plain "mixture" state (pH/visual colors only).
 * Faithful port of getFlaskState() in the original game.js.
 */
export const getFlaskState = (
  indices: FlaskInput[],
  labData: LabData | undefined,
  itemsData: ItemData[],
  excludeKey: string | null = null
): FlaskReactionState => {
  const state: FlaskReactionState = {
    ph: 7.0,
    temp: 298.0,
    reactionName: '',
    visualColors: [],
    productType: null,
    reactionKey: null,
    reactingIndices: [],
    limitingYield: 1.0,
    isEquilibrium: false,
    direction: 'forward',
    K: null,
    outcome: null,
  };

  if (!indices || indices.length === 0) return state;

  const flaskCounts: { [id: string]: number } = {};
  const flaskInstances: { [id: string]: FlaskInput[] } = {};

  indices.forEach(item => {
    const id = idOf(item);
    const qty = qtyOf(item);
    const strId = String(id);
    flaskCounts[strId] = (flaskCounts[strId] || 0) + qty;
    if (!flaskInstances[strId]) flaskInstances[strId] = [];
    flaskInstances[strId].push(item);
  });

  const newPH = calculateMixPH(indices.map(idOf), labData, itemsData);
  if (newPH !== null) state.ph = newPH;

  let outcome: any = null;
  let reactionData: any = null;
  let reactingIndices: (string | number)[] = [];

  if (labData && labData.reaction && indices.length >= 1) {
    const cached = getParsedReactionData(labData, itemsData);
    reactionData = cached ? cached.reactionData : null;

    if (reactionData) {
      const reactionKeys = cached!.reactionKeys;

      for (const key of reactionKeys) {
        if (excludeKey && key === excludeKey) continue;

        let baseKey = key;
        let isEq = false;
        let kVal: number | null = null;

        if (baseKey.includes('eq')) {
          isEq = true;
          kVal = 1.0;
          const kMatch = baseKey.match(/eqK([\d.]+)/);
          if (kMatch) kVal = parseFloat(kMatch[1]);
          baseKey = baseKey.split('eq')[0];
        }

        const reactantParts = baseKey.split('_');
        const requiredIndicesForReaction: (string | number)[] = [];
        let minYield = Infinity;
        let hasReactant = false;
        let hasProduct = false;
        let allReactantsPresent = true;

        let productIds: string[] = [];
        if (isEq && reactionData[key]) {
          const eqOutcomes = Array.isArray(reactionData[key]) ? reactionData[key] : [reactionData[key]];
          productIds = eqOutcomes.map((o: any) => String(o.id));
        }

        for (const part of reactantParts) {
          let count = 1;
          let id: string = part;
          if (part.includes('*')) {
            const pieces = part.split('*');
            if (pieces.length === 2 && !isNaN(Number(pieces[0]))) {
              count = parseInt(pieces[0]);
              id = pieces[1];
            }
          }

          if (labData && labData['beaker' + id]) {
            id = labData['beaker' + id];
          }

          const available = flaskCounts[id] || 0;
          if (available > 0.0001) {
            hasReactant = true;
          } else {
            allReactantsPresent = false;
          }

          const theoreticalYield = available / count;
          if (theoreticalYield < minYield) minYield = theoreticalYield;

          if (flaskInstances[id]) {
            const instancesToUse = flaskInstances[id].map(obj => idOf(obj));
            requiredIndicesForReaction.push(...instancesToUse);
          }
        }

        let match: boolean;
        if (isEq) {
          for (const pid of productIds) {
            if ((flaskCounts[pid] || 0) > 0.0001) {
              hasProduct = true;
              break;
            }
          }
          match = hasReactant || hasProduct;
        } else {
          match = allReactantsPresent;
        }

        if (!match) continue;

        let finalYield = minYield;

        // --- Equilibrium logic ---
        if (isEq && kVal !== null) {
          state.isEquilibrium = true;
          state.K = kVal;

          const reactants: { count: number; available: number; type: string }[] = [];
          for (const part of reactantParts) {
            let count = 1;
            let rawId = part;
            if (part.includes('*')) {
              const pieces = part.split('*');
              if (pieces.length === 2 && !isNaN(Number(pieces[0]))) {
                count = parseInt(pieces[0]);
                rawId = pieces[1];
              }
            }

            let resolvedId = rawId;
            if (labData && labData['beaker' + rawId]) resolvedId = labData['beaker' + rawId];

            let type = 'liquid';
            const item = itemsData.find(i => i.id === resolvedId || i.name === resolvedId);
            if (item && item.attributes) {
              const attr = parseAttrString(item.attributes);
              if (attr && attr.type) type = attr.type;
            }

            if (labData) {
              if (labData['attributes' + rawId]) {
                const attrParsed = parseAttrString(labData['attributes' + rawId]);
                if (attrParsed && attrParsed.type) type = attrParsed.type;
              } else {
                for (let i = 1; i <= 4; i++) {
                  if (labData['beaker' + i] === resolvedId) {
                    const attrStr = labData['attributes' + i];
                    if (attrStr) {
                      const attrParsed = parseAttrString(attrStr);
                      if (attrParsed && attrParsed.type) type = attrParsed.type;
                    }
                    break;
                  }
                }
              }
            }

            reactants.push({ count, available: flaskCounts[resolvedId] || 0, type });
          }

          const products: { count: number; available: number; type: string }[] = [];
          const outcomeArr = reactionData[key] || [];
          const productCounts: { [id: string]: number } = {};
          const productTypes: { [id: string]: string } = {};
          outcomeArr.forEach((p: any) => {
            const pid = p.id;
            const pCount = p.count ? parseInt(p.count) : 1;
            productCounts[pid] = (productCounts[pid] || 0) + pCount;
            if (p.type) productTypes[pid] = p.type;
          });

          Object.keys(productCounts).forEach(pid => {
            let type = productTypes[pid] || 'liquid';
            if (!productTypes[pid]) {
              const item = itemsData.find(i => i.id === pid || i.name === pid);
              if (item && item.attributes) {
                const attr = parseAttrString(item.attributes);
                if (attr && attr.type) type = attr.type;
              }
            }
            products.push({ count: productCounts[pid], available: flaskCounts[pid] || 0, type });
          });

          let totalLiquidVolume_L = 0;
          Object.keys(flaskCounts).forEach(fid => {
            let itemType = 'liquid';
            let molarMass = 10.0;
            const item = itemsData.find(i => i.id === fid || i.name === fid);
            if (item) {
              if (item.M) molarMass = parseFloat(String(item.M));
              if (item.attributes) {
                const attr = parseAttrString(item.attributes);
                if (attr && attr.type) itemType = attr.type;
              }
            }
            if (itemType === 'liquid') {
              totalLiquidVolume_L += (flaskCounts[fid] * molarMass) / 1000;
            }
          });
          if (totalLiquidVolume_L === 0) totalLiquidVolume_L = 1.0;

          const getActivity = (moles: number, type: string): number => {
            if (type === 'gas' || type === 'trapped_gas') {
              const R = 0.08206;
              const T = state.temp || 298;
              return (moles * R * T) / 1.0;
            } else if (type === 'aqueous' || type === 'aq') {
              return moles / totalLiquidVolume_L;
            } else if (type === 'solid' || type === 'liquid') {
              return 1.0;
            }
            return moles;
          };

          let num0 = 1;
          products.forEach(p => (num0 *= Math.pow(getActivity(p.available, p.type), p.count)));
          let den0 = 1;
          reactants.forEach(r => (den0 *= Math.pow(getActivity(r.available, r.type), r.count)));
          void num0;
          void den0;

          let maxReverseYield = Infinity;
          products.forEach(p => {
            if (p.type !== 'liquid') {
              const theoreticalRev = p.available / p.count;
              if (theoreticalRev < maxReverseYield) maxReverseYield = theoreticalRev;
            }
          });
          if (products.length === 0 || products.every(p => p.type === 'liquid')) maxReverseYield = 0;

          let low = -maxReverseYield;
          let high = minYield;

          for (let i = 0; i < 100; i++) {
            const mid = (low + high) / 2;

            if (mid >= minYield * 0.999999) {
              high = mid;
              continue;
            }
            if (mid <= -maxReverseYield * 0.999999) {
              low = mid;
              continue;
            }

            let num = 1;
            products.forEach(
              p => (num *= Math.pow(getActivity(Math.max(0, p.available + p.count * mid), p.type), p.count))
            );
            let den = 1;
            reactants.forEach(
              r => (den *= Math.pow(getActivity(Math.max(0, r.available - r.count * mid), r.type), r.count))
            );

            if (den <= 1e-9) {
              high = mid;
              continue;
            }

            const Q = num / den;
            if (Q < kVal) {
              low = mid;
            } else {
              high = mid;
            }
          }
          finalYield = low;
        }

        // Apply yield lower bound filter to prevent micro-reactions
        if (Math.abs(finalYield) < 0.0000001) continue;

        state.reactionKey = key;
        state.reactingIndices = requiredIndicesForReaction;
        state.outcome = reactionData[key];

        // Generate reaction name (equation)
        let leftSide = '';
        reactantParts.forEach((part, idx) => {
          let count: number | string = 1;
          let id = part;
          if (part.includes('*')) {
            const p = part.split('*');
            count = p[0];
            id = p[1];
          }
          const resolved = resolveId(id, labData, itemsData);
          if (idx > 0) leftSide += ' + ';
          leftSide += (Number(count) > 1 ? count + ' ' : '') + cleanTeX(String(resolved)) + getPhysicalStateSymbol(id, labData, itemsData);
        });

        let rightSide = '';
        if (state.outcome) {
          const outArr = Array.isArray(state.outcome) ? state.outcome : [state.outcome];
          const counts: { [id: string]: number } = {};
          const outTypes: { [id: string]: string } = {};
          outArr.forEach((o: any) => {
            const oCount = o.count ? parseInt(o.count) : 1;
            counts[o.id] = (counts[o.id] || 0) + oCount;
            if (o.type) outTypes[o.id] = o.type;
          });

          Object.keys(counts).forEach((oid, idx) => {
            if (idx > 0) rightSide += ' + ';
            const c = counts[oid];
            let sym = '';
            if (outTypes[oid]) {
              const type = outTypes[oid];
              if (type === 'solid') sym = '_{(s)}';
              else if (type === 'liquid') sym = '_{(l)}';
              else if (type === 'gas' || type === 'trapped_gas') sym = '_{(g)}';
              else if (type === 'aqueous' || type === 'aq') sym = '_{(aq)}';
            } else {
              sym = getPhysicalStateSymbol(oid, labData, itemsData);
            }
            rightSide += (c > 1 ? c + ' ' : '') + cleanTeX(String(resolveId(oid, labData, itemsData) || oid)) + sym;
          });
        }

        const arrow = isEq ? ' <=> ' : ' -> ';
        state.reactionName = '\\(\\ce{' + leftSide + arrow + rightSide + '}\\)';

        if (state.outcome && state.outcome.length > 0) {
          const first = state.outcome[0];
          state.productType = first.type;
          state.productColor = first.color;
          state.productName = first.name || first.id;

          state.triggerConditional = false;
          const outArr = Array.isArray(state.outcome) ? state.outcome : [state.outcome];
          outArr.forEach((p: any) => {
            if (p && (p.conditional === 'true' || p.conditional === true || p.conditional === 1)) {
              state.triggerConditional = true;
            }
          });
          state.script = first.script;
        }

        state.limitingYield = finalYield;
        return state;
      }
    }

    state.outcome = outcome;
    state.reactingIndices = reactingIndices;
    state.reactionKey = outcome
      ? [...reactingIndices].sort((a, b) => String(a).localeCompare(String(b))).join('_')
      : null;

    let visualColors: string[] = [];

    const tempReactants = reactingIndices ? [...reactingIndices] : [];
    indices.forEach(item => {
      const bId = idOf(item);
      const rIndex = tempReactants.indexOf(bId);
      if (rIndex > -1) {
        tempReactants.splice(rIndex, 1);
      } else {
        const colors = getColors([bId], labData, itemsData);
        if (colors.length > 0) visualColors.push(colors[0]);
      }
    });

    if (outcome) {
      const outcomes = Array.isArray(outcome) ? outcome : [outcome];
      state.products = outcomes;

      const productNames: string[] = [];
      const productScripts: string[] = [];
      let primaryType: string | null = null;
      let primaryColor: string | undefined;

      outcomes.forEach((prod: any) => {
        if (typeof prod === 'string') {
          if (prod === 'solid') {
            if (!primaryType) {
              primaryType = 'solid';
              primaryColor = reactionData?.solidcolor;
            }
          }
          productNames.push('Unknown Product');
        } else {
          productNames.push(prod.id || 'Unknown Product');
          if (prod.script) productScripts.push(prod.script);

          if (prod.type === 'solid') {
            primaryType = 'solid';
            primaryColor = prod.color;
          } else if ((prod.type === 'gas' || prod.type === 'trapped_gas') && primaryType !== 'solid') {
            primaryType = prod.type;
            primaryColor = prod.color;
          } else if (prod.type === 'liquid' && !primaryType) {
            primaryType = 'liquid';
            primaryColor = prod.color;
          }

          if ((prod.type === 'liquid' || prod.type === 'aqueous' || prod.type === 'aq') && prod.color) {
            visualColors.push(prod.color);
          } else if (prod.type === 'aq' || prod.type === 'aqueous') {
            visualColors.push('#A0D0FF');
          }
        }
      });

      let totalTemp = 0;
      let tempCount = 0;
      outcomes.forEach((o: any) => {
        if (o.temp) {
          totalTemp += parseInt(o.temp);
          tempCount++;
        }
      });
      if (tempCount > 0) {
        state.temp = Math.floor(totalTemp / tempCount);
      } else if (reactionData && reactionData.temp) {
        state.temp = parseInt(reactionData.temp);
      }

      let totalH_prod = 0;
      let phCount = 0;
      outcomes.forEach((o: any) => {
        if (o.ph !== undefined) {
          const ph = parseFloat(o.ph);
          const molesH = Math.pow(10, -ph);
          const molesOH = Math.pow(10, -(14 - ph));
          totalH_prod += molesH - molesOH;
          phCount++;
        }
      });

      if (phCount > 0) {
        const avgNetH = totalH_prod / phCount;
        if (avgNetH > 0) {
          state.ph = -Math.log10(avgNetH);
        } else if (avgNetH < 0) {
          state.ph = 14 - -Math.log10(-avgNetH);
        } else {
          state.ph = 7.0;
        }
        state.ph = Math.round(state.ph * 100) / 100;
      }

      const reactantIds: (string | number)[] = [];
      reactingIndices.forEach(idx => {
        let id: string | number | null = null;
        if (typeof idx === 'number') {
          const attr = getAttributes(idx, labData, itemsData);
          if (attr && attr.id) id = attr.id;
          else if (labData && labData['beaker' + idx]) id = labData['beaker' + idx];
        } else {
          id = idx;
        }
        if (id) reactantIds.push(id);
      });

      const rCounts: { [id: string]: number } = {};
      reactantIds.forEach(id => (rCounts[String(id)] = (rCounts[String(id)] || 0) + 1));
      const reactantsStr = Object.keys(rCounts)
        .map(id => {
          const count = rCounts[id];
          return (count > 1 ? count + ' ' : '') + cleanTeX(id) + getPhysicalStateSymbol(id, labData, itemsData);
        })
        .join(' + ');

      const pCounts: { [id: string]: number } = {};
      const pTypes: { [id: string]: string } = {};
      outcomes.forEach((prod: any) => {
        const id = typeof prod === 'string' ? 'Unknown Product' : prod.id || 'Unknown Product';
        const count = typeof prod === 'string' ? 1 : prod.count ? parseInt(prod.count) : 1;
        pCounts[id] = (pCounts[id] || 0) + count;
        if (typeof prod !== 'string' && prod.type) pTypes[id] = prod.type;
      });
      const productsStr = Object.keys(pCounts)
        .map(id => {
          const count = pCounts[id];
          let sym = '';
          if (pTypes[id]) {
            const type = pTypes[id];
            if (type === 'solid') sym = '_{(s)}';
            else if (type === 'liquid') sym = '_{(l)}';
            else if (type === 'gas' || type === 'trapped_gas') sym = '_{(g)}';
            else if (type === 'aqueous' || type === 'aq') sym = '_{(aq)}';
          } else {
            sym = getPhysicalStateSymbol(id, labData, itemsData);
          }
          return (count > 1 ? count + ' ' : '') + cleanTeX(id) + sym;
        })
        .join(' + ');

      state.reactantList = reactantIds.map(String);
      state.productList = productNames;

      const arrow = state.isEquilibrium ? '<=>' : '->';
      state.reactionName = `$$\\ce{${reactantsStr} ${arrow} ${productsStr}}$$`;
      state.productName = productsStr;
      state.script = productScripts.join(';');

      if (primaryType) {
        state.productType = primaryType;
        state.productColor = primaryColor;
      } else if (outcomes.length > 0 && typeof outcomes[0] === 'object') {
        state.productType = outcomes[0].type;
        state.productColor = outcomes[0].color;
      }
    }

    state.visualColors = visualColors;

    if (state.products) {
      state.products.forEach((p: any) => {
        if (p && (p.conditional === 'true' || p.conditional === true || p.conditional === 1)) {
          state.triggerConditional = true;
        }
      });
    }
  }

  return state;
};
