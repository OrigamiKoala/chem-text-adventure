import { ItemData, LabFlaskState, BeakerItem, FlaskLiquidLayer } from '../types/game';
import { cleanTeX, stripHtml } from './textParser';

/**
 * Calculates mixed pH for a set of items based on acidic / basic content
 */
export const calculateMixPH = (
  items: (string | BeakerItem)[],
  itemsData: ItemData[],
  labData?: any
): number => {
  if (items.length === 0) return 7.0;

  let totalH = 0;

  items.forEach(item => {
    const id = typeof item === 'object' ? item.id : item;
    let ph = 7.0;

    const itemDef = itemsData.find(i => i.id === id);
    if (itemDef) {
      if (itemDef.ph !== undefined) ph = Number(itemDef.ph);
      else if (itemDef.attributes && typeof itemDef.attributes === 'object' && itemDef.attributes.ph !== undefined) {
        ph = Number(itemDef.attributes.ph);
      }
    } else if (labData) {
      // Check lab beaker attributes
      for (let b = 1; b <= 20; b++) {
        if (labData['beaker' + b] === id && labData['attributes' + b]) {
          try {
            const attr = typeof labData['attributes' + b] === 'string'
              ? JSON.parse(labData['attributes' + b])
              : labData['attributes' + b];
            if (attr.ph !== undefined) ph = Number(attr.ph);
          } catch (e) { }
          break;
        }
      }
    }

    const molesH = Math.pow(10, -ph);
    const molesOH = Math.pow(10, -(14 - ph));
    totalH += molesH - molesOH;
  });

  const avgNetH = totalH / items.length;

  if (avgNetH > 0) {
    return -Math.log10(avgNetH);
  } else if (avgNetH < 0) {
    const avgNetOH = -avgNetH;
    const pOH = -Math.log10(avgNetOH);
    return 14 - pOH;
  } else {
    return 7.0;
  }
};

/**
 * Helper to extract attributes object for a chemical item or beaker ID
 */
export const getItemAttributes = (id: string | number, itemsData: ItemData[], labData?: any): any => {
  let realId = id;
  if (typeof id === 'number' && labData && labData['beaker' + id]) {
    realId = labData['beaker' + id];
  }

  const strId = String(realId);

  // Search itemsData
  const item = itemsData.find(i => i.id === strId || i.name === strId);
  if (item && item.attributes) {
    if (typeof item.attributes === 'object') return item.attributes;
    try {
      const sanitized = (item.attributes as string).replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
      return JSON.parse(sanitized);
    } catch (e) { }
  }

  // Search labData
  if (labData) {
    for (let i = 1; i <= 20; i++) {
      if (labData['beaker' + i] === strId && labData['attributes' + i]) {
        const rawStr = labData['attributes' + i];
        try {
          const sanitized = rawStr.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
          return JSON.parse(sanitized);
        } catch (e) { }
      }
    }
  }

  return null;
};

const inferTypeFromId = (id: string): string => {
  const lower = id.toLowerCase();
  if (['n2', 'h2', 'nh3', 'hcl_gas', 'o2', 'co2', 'ch4', 'cl2'].includes(lower) || lower.includes('gas')) {
    return 'gas';
  }
  if (['powder1', 'powder2', 'fe', 'nh4cl_powder', 'nacl', 'powder'].includes(lower) || lower.includes('powder') || lower.includes('solid')) {
    return 'solid';
  }
  return 'liquid';
};

const inferColorFromId = (id: string): string => {
  const lower = id.toLowerCase();
  if (lower === 'n2') return 'rgba(147, 197, 253, 0.7)';
  if (lower === 'h2') return 'rgba(220, 235, 255, 0.7)';
  if (lower === 'nh3') return 'rgba(167, 243, 208, 0.75)';
  if (lower === 'hcl_gas') return 'rgba(252, 165, 165, 0.75)';
  if (lower === 'powder1') return 'rgba(244, 244, 245, 0.9)';
  if (lower === 'powder2') return 'rgba(200, 200, 210, 0.9)';
  if (lower === 'fe') return 'rgba(217, 119, 6, 0.85)';
  if (lower === 'nh4cl_powder') return 'rgba(224, 231, 255, 0.9)';
  if (lower === 'nacl') return 'rgba(168, 85, 247, 0.5)';
  if (lower === 'water') return 'rgba(56, 189, 248, 0.6)';
  if (lower === 'hcl') return 'rgba(239, 68, 68, 0.6)';
  if (lower === 'naoh') return 'rgba(59, 130, 246, 0.6)';
  if (lower === 'agno3') return 'rgba(234, 179, 8, 0.6)';
  return 'rgba(100, 180, 255, 0.4)';
};

/**
 * Compute Flask state (pH, liquid layers, solid layer, gas layer) from mixed inputs
 */
export const computeFlaskState = (
  contents: (string | BeakerItem)[],
  itemsData: ItemData[],
  labData?: any
): LabFlaskState => {
  const state: LabFlaskState = {
    liquids: [],
    solid: null,
    gas: null,
    temperature: 298.15,
    pressure: 1.0,
    totalVolume: 0.1 * contents.length || 0.1,
    pH: calculateMixPH(contents, itemsData, labData),
    moles: contents.length * 0.1,
  };

  if (!contents || contents.length === 0) return state;

  const flaskCounts: { [id: string]: number } = {};

  contents.forEach(item => {
    const id = typeof item === 'object' ? item.id : item;
    const qty = typeof item === 'object' && item.qty ? item.qty : 1.0;
    const strId = String(id);
    flaskCounts[strId] = (flaskCounts[strId] || 0) + qty;
  });

  const uniqueIds = Object.keys(flaskCounts);
  const liquidLayers: FlaskLiquidLayer[] = [];

  uniqueIds.forEach(id => {
    const attr = getItemAttributes(id, itemsData, labData);
    const itemDef = itemsData.find(i => i.id === id || i.name === id);
    const color = attr?.color || itemDef?.color || inferColorFromId(id);
    const type = attr?.type || itemDef?.type || inferTypeFromId(id);

    if (type === 'solid') {
      state.solid = {
        type: 'solid',
        color: color,
        name: itemDef?.name || id,
      };
    } else if (type === 'gas' || type === 'trapped_gas') {
      state.gas = {
        type: type,
        color: color,
        isProductGas: true,
        bubbleColor: 'rgba(255, 255, 255, 0.7)',
      };
    } else {
      liquidLayers.push({
        id,
        name: itemDef?.name || id,
        color,
        volumePercent: 100 / uniqueIds.length,
        moles: flaskCounts[id],
        ph: attr?.ph || itemDef?.ph,
      });
    }
  });

  state.liquids = liquidLayers;
  return state;
};

