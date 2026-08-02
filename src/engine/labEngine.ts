import { ItemData, LabData, FlaskToken, FlaskReactionState } from '../types/game';
import { getFlaskState, getAttributes } from './reactionEngine';

/**
 * Flask "visualStack" management: chain-reaction detection and reaction application.
 * Faithful port of checkFlaskReactions() / queueReaction() from the original game.js.
 * These are pure functions — the owning hook is responsible for the async
 * timing (debounce / wait / re-check delays) that the original achieved with
 * setTimeout chains against a mutable module-level `visualStack`.
 */

const cloneToken = (t: FlaskToken): FlaskToken => ({ ...t, ids: [...t.ids] });

let uidCounter = 0;
const uid = (): string => `tok-${Date.now()}-${uidCounter++}`;

/**
 * Decide which reaction (if any) should fire next, given the current flask contents.
 * Mirrors checkFlaskReactions()'s loop-prevention + retry logic.
 */
export const determineNextReaction = (
  visualStack: FlaskToken[],
  labData: LabData | undefined,
  itemsData: ItemData[]
): FlaskReactionState | null => {
  const allIds = visualStack
    .filter(v => !(v.isProduct && v.type === 'gas'))
    .filter(v => v.ids && v.ids.length > 0)
    .map(v => ({ id: v.ids[0], qty: v.quantity !== undefined ? v.quantity : 1.0 }));

  if (allIds.length < 1) return null;

  const state = getFlaskState(allIds, labData, itemsData);
  if (!state.reactionKey) return null;

  const loopCandidates = visualStack.filter(
    v => v.isProduct && state.reactingIndices.every(reqId => v.ids && v.ids.includes(reqId))
  );
  const internalReaction = loopCandidates.length > 0 && !state.isEquilibrium;

  if (!internalReaction) {
    return state;
  }

  // RETRY 1: would the reaction still happen without the "locked" (already-product) ingredients?
  const freeIds = [...allIds];
  state.reactingIndices.forEach(lockedId => {
    const idx = freeIds.findIndex(item => String(item.id) === String(lockedId));
    if (idx > -1) freeIds.splice(idx, 1);
  });

  const freeState = getFlaskState(freeIds, labData, itemsData);
  if (freeState.reactionKey) {
    return freeState;
  }

  // RETRY 2: is there a different reaction (e.g. reverse) excluding this key?
  const nextState = getFlaskState(allIds, labData, itemsData, state.reactionKey);
  if (nextState.reactionKey && nextState.reactionKey !== state.reactionKey) {
    return nextState;
  }

  return null;
};

export interface ApplyReactionResult {
  newStack: FlaskToken[];
  ph: number;
  temp: number;
  reactionName: string;
  productName: string;
  script: string;
  productType: string;
  productColor: string;
  products: any[];
  triggerConditional: boolean;
  /** Product tokens flagged as ephemeral gas that should self-clear after 4s */
  ephemeralGasTokens: FlaskToken[];
}

/**
 * Apply a matched reaction to the flask: consume reactants by stoichiometry * yield,
 * produce products, and return the updated stack + display globals.
 * Faithful port of the synchronous body of queueReaction().
 */
export const applyReaction = (
  state: FlaskReactionState,
  visualStack: FlaskToken[],
  labData: LabData | undefined,
  itemsData: ItemData[]
): ApplyReactionResult | null => {
  const yieldFraction = state.limitingYield || 1.0;

  const consumptionNeeds: { [id: string]: number } = {};

  if (state.reactionKey) {
    const reactionStr = state.reactionKey.split('eq')[0].split('->')[0];
    const parts = reactionStr.split('_');
    parts.forEach(p => {
      let count = 1;
      let id = p;
      if (p.includes('*')) {
        const pieces = p.split('*');
        count = parseFloat(pieces[0]);
        id = pieces[1];
      }
      if (labData && labData['beaker' + id]) {
        id = labData['beaker' + id];
      }
      consumptionNeeds[id] = count * yieldFraction;
    });
  }

  let consumed = false;
  const consumedIds: (string | number)[] = [];

  const working = visualStack.map(cloneToken);

  working.forEach(token => {
    const primaryId = token.ids.length > 0 ? token.ids[0] : null;
    const matchId =
      primaryId !== null && Math.abs(consumptionNeeds[String(primaryId)] || 0) > 0.0001 ? primaryId : null;

    if (matchId !== null) {
      const needed = consumptionNeeds[String(matchId)];
      const available = token.quantity !== undefined ? token.quantity : 1.0;

      let take: number;
      if (needed > 0) {
        take = Math.min(available, needed);
      } else {
        take = needed;
      }

      token.quantity = available - take;
      consumptionNeeds[String(matchId)] -= take;

      if (token.quantity <= 0.01) {
        token.toRemove = true;
      }

      consumed = true;
      consumedIds.push(...token.ids);
    }
  });

  let newStack = working.filter(t => !t.toRemove);

  Object.keys(consumptionNeeds).forEach(id => {
    if (consumptionNeeds[id] < -0.0001) {
      const addedQty = -consumptionNeeds[id];
      let color = 'rgba(255, 255, 255, 0.2)';
      let type = 'liquid';

      const attr = !isNaN(Number(id)) ? getAttributes(parseInt(id), labData, itemsData) : getAttributes(id, labData, itemsData);
      if (attr) {
        if (attr.color) color = attr.color;
        if (attr.type) type = attr.type;
      }

      newStack.push({ ids: [id], type, color, quantity: addedQty, _uid: uid() });
      consumed = true;
    }
  });

  if (!consumed && !state.isEquilibrium) {
    return null;
  }

  const uniqueConsumedIds = [...new Set(consumedIds)];
  const products: any[] = state.outcome || state.products || [];
  const productsToAdd = [...products];

  if (productsToAdd.length === 0 && state.productType) {
    productsToAdd.push({
      type: state.productType,
      color: state.productColor || '#fff',
      id: state.productName,
    });
  }

  const ephemeralGasTokens: FlaskToken[] = [];

  if (productsToAdd.length > 0) {
    productsToAdd.forEach(prod => {
      let finalType = prod.type || 'liquid';
      let finalColor = prod.color;
      if (!finalColor) {
        finalColor = finalType === 'aq' || finalType === 'aqueous' ? '#A0D0FF' : '#fff';
      }

      const pCount = prod.count || 1;
      const productQty = yieldFraction * pCount;

      const compoundIds = prod.id ? [prod.id, ...uniqueConsumedIds] : [...uniqueConsumedIds];
      const finalIds = [...new Set(compoundIds)];

      if (state.isEquilibrium) {
        let remainingToAdd = productQty;
        for (let i = 0; i < newStack.length; i++) {
          const v = newStack[i];
          let isMatch = false;
          if (v.ids) {
            isMatch = v.ids.some(vid => {
              let resolved: string | number = vid;
              if (labData && labData['beaker' + vid]) resolved = labData['beaker' + vid];
              return resolved === prod.id || String(vid) === String(prod.id);
            });
          }
          if (isMatch) {
            if (remainingToAdd < 0) {
              const take = Math.min(v.quantity || 1.0, -remainingToAdd);
              v.quantity = (v.quantity || 1.0) - take;
              remainingToAdd += take;
              if (v.quantity <= 0.01) v.toRemove = true;
            } else if (remainingToAdd > 0) {
              v.quantity = (v.quantity || 1.0) + remainingToAdd;
              remainingToAdd = 0;
            }
          }
        }

        if (Math.abs(remainingToAdd) < 0.001) return;
        if (remainingToAdd < 0) return;
      }

      if (productQty > 0.01) {
        let existingToken: FlaskToken | undefined;
        if (!state.isEquilibrium && prod.id) {
          existingToken = newStack.find(t => {
            if (!t.ids) return false;
            return t.ids.some(vid => {
              let resolved: string | number = vid;
              if (labData && labData['beaker' + vid]) resolved = labData['beaker' + vid];
              return resolved === prod.id || String(vid) === String(prod.id);
            });
          });
        }

        if (existingToken) {
          existingToken.quantity = (existingToken.quantity || 1.0) + productQty;
        } else {
          const token: FlaskToken = {
            ids: finalIds,
            type: finalType,
            color: finalColor,
            isProduct: true,
            quantity: productQty,
            _uid: uid(),
          };
          newStack.push(token);

          if (prod.type === 'gas' && !state.isEquilibrium) {
            ephemeralGasTokens.push(token);
          }
        }
      }
    });
  }

  newStack = newStack.filter(t => !t.toRemove);

  return {
    newStack,
    ph: state.ph,
    temp: state.temp,
    reactionName: state.reactionName,
    productName: state.productName || '',
    script: state.script || '',
    productType: state.productType || 'liquid',
    productColor: state.productColor || 'white',
    products: state.products || [],
    triggerConditional: !!state.triggerConditional,
    ephemeralGasTokens,
  };
};
