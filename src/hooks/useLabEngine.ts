import { useState, useRef, useCallback, useEffect } from 'react';
import { ItemData, LabData, FlaskToken, InventoryMap } from '../types/game';
import { getAttributes, getColors } from '../engine/reactionEngine';
import { determineNextReaction, applyReaction } from '../engine/labEngine';
import { cleanTeX, stripHtml } from '../engine/textParser';

interface UseLabEngineParams {
  labData: LabData | undefined;
  itemsData: ItemData[];
  registerItem: (item: ItemData) => void;
  inventory: InventoryMap;
  addItemToInventory: (itemId: string, qty?: number) => void;
  removeItemFromInventory: (itemId: string, qty?: number) => void;
  isLabVisible: boolean;
  onConditionalTrigger?: () => void;
}

/**
 * Owns the lab flask's "visualStack" simulation: adding reagents, chained reaction
 * detection/resolution, returning contents to inventory, and passive cooling toward
 * ambient temperature. Faithful (React-adapted) port of the launch()/checkFlaskReactions()/
 * queueReaction() logic in the original game.js.
 */
export const useLabEngine = ({
  labData,
  itemsData,
  registerItem,
  inventory,
  addItemToInventory,
  removeItemFromInventory,
  isLabVisible,
  onConditionalTrigger,
}: UseLabEngineParams) => {
  const [visualStack, setVisualStack] = useState<FlaskToken[]>([]);
  const [selectedBeakers, setSelectedBeakers] = useState<(string | number)[]>([]);
  const [currentPH, setCurrentPH] = useState(7.0);
  const [currentTemperature, setCurrentTemperature] = useState(298);
  const [currentReactionName, setCurrentReactionName] = useState('');
  const [currentProductName, setCurrentProductName] = useState('');
  const [currentReactionScript, setCurrentReactionScript] = useState('');
  const [currentProductType, setCurrentProductType] = useState('liquid');
  const [currentProductColor, setCurrentProductColor] = useState('white');
  const [currentProducts, setCurrentProducts] = useState<any[]>([]);
  const [flaskActive, setFlaskActive] = useState(false);

  // Refs mirror latest values so the async reaction chain never reads stale closures.
  const visualStackRef = useRef(visualStack);
  const labDataRef = useRef(labData);
  const itemsDataRef = useRef(itemsData);
  const currentPHRef = useRef(currentPH);
  const currentTemperatureRef = useRef(currentTemperature);
  const chainTokenRef = useRef(0); // bumped on reset so an in-flight chain can bail out
  const isChainRunningRef = useRef(false); // guards against overlapping runReactionChain recursions

  useEffect(() => { visualStackRef.current = visualStack; }, [visualStack]);
  useEffect(() => { labDataRef.current = labData; }, [labData]);
  useEffect(() => { itemsDataRef.current = itemsData; }, [itemsData]);
  useEffect(() => { currentPHRef.current = currentPH; }, [currentPH]);
  useEffect(() => { currentTemperatureRef.current = currentTemperature; }, [currentTemperature]);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Runs the reaction chain: find -> wait 500ms -> apply -> wait 500ms -> repeat.
  const runReactionChain = useCallback(async (myToken: number) => {
    const state = determineNextReaction(visualStackRef.current, labDataRef.current, itemsDataRef.current);
    if (!state || !state.reactionKey) return;

    await new Promise(r => setTimeout(r, 500));
    if (chainTokenRef.current !== myToken) return;

    const result = applyReaction(state, visualStackRef.current, labDataRef.current, itemsDataRef.current);
    if (!result) return;
    if (chainTokenRef.current !== myToken) return;

    visualStackRef.current = result.newStack;
    setVisualStack(result.newStack);
    setCurrentPH(result.ph);
    setCurrentTemperature(result.temp);
    setCurrentReactionName(result.reactionName);
    setCurrentProductName(result.productName);
    setCurrentReactionScript(result.script);
    setCurrentProductType(result.productType);
    setCurrentProductColor(result.productColor);
    setCurrentProducts(result.products);

    setFlaskActive(true);
    setTimeout(() => setFlaskActive(false), 1000);

    if (result.triggerConditional) onConditionalTrigger?.();

    result.ephemeralGasTokens.forEach(token => {
      setTimeout(() => {
        if (chainTokenRef.current !== myToken) return;
        setVisualStack(prev => {
          const next = prev.filter(v => v._uid !== token._uid);
          visualStackRef.current = next;
          return next;
        });
      }, 4000);
    });

    await new Promise(r => setTimeout(r, 500));
    if (chainTokenRef.current !== myToken) return;
    await runReactionChain(myToken);
  }, [onConditionalTrigger]);

  // Guards against overlapping chains: if a chain is already in flight, a newly-added
  // reagent doesn't need its own chain — the running chain re-reads visualStackRef fresh
  // on each iteration and will naturally pick up the new state on its next ~1s poll.
  const startReactionChain = useCallback(
    async (myToken: number) => {
      if (isChainRunningRef.current) return;
      isChainRunningRef.current = true;
      try {
        await runReactionChain(myToken);
      } finally {
        isChainRunningRef.current = false;
      }
    },
    [runReactionChain]
  );

  // Debounce the reaction check to allow multiple additions in quick succession.
  const scheduleReactionCheck = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      startReactionChain(chainTokenRef.current);
    }, 500);
  }, [startReactionChain]);

  /**
   * Add a reagent to the flask, either from a lab beaker (numeric index 1-4) or
   * an inventory item (chemical id string). Prompts for an amount, exactly as
   * the original did with window.prompt. Returns false if the add did not happen
   * (nonreactant item, beaker full, invalid/cancelled amount) so callers (e.g.
   * "use item" from inventory) know whether to decrement inventory.
   */
  const addLiquid = useCallback((id: string | number): boolean => {
    const stack = visualStackRef.current;
    const lData = labDataRef.current;
    const items = itemsDataRef.current;

    let volume = 0;
    stack.forEach(v => {
      if (v.type === 'liquid' || !v.type) volume++;
    });

    const attr = getAttributes(id, lData, items);
    if (attr && attr.type === 'nonreactant') {
      return false;
    }

    if (volume >= 4) {
      if (typeof window !== 'undefined') window.alert('Beaker full');
      return false;
    }

    let trueId: string | number = id;
    if (lData && (typeof id === 'number' || (typeof id === 'string' && /^[1-4]$/.test(id)))) {
      trueId = lData['beaker' + id] || id;
    }

    const itemDef = items.find(i => i.id === trueId);
    let itemName: string = String(trueId);
    if (itemDef && itemDef.name) itemName = stripHtml(itemDef.name);
    else itemName = String(cleanTeX(String(trueId)));
    const molarMass = itemDef && itemDef.M ? parseFloat(String(itemDef.M)) : 10.0;

    let itemType = 'liquid';
    if (attr && attr.type) itemType = attr.type;

    let unit = 'mL';
    if (itemType === 'solid') unit = 'g';
    else if (itemType === 'gas' || itemType === 'trapped_gas') unit = 'moles';

    const amountStr = typeof window !== 'undefined' ? window.prompt(`How much ${itemName} do you want to add? (in ${unit})`) : null;
    if (amountStr === null) return false;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      if (typeof window !== 'undefined') window.alert('Please enter a valid positive number.');
      return false;
    }

    let quantity = amount;
    if (itemType === 'solid') quantity = amount / molarMass;
    else if (itemType === 'liquid') quantity = amount / molarMass;
    else if (itemType === 'aq' || itemType === 'aqueous') {
      let concentration = 1.0;
      if (attr && attr.concentration) concentration = parseFloat(attr.concentration) || 1.0;
      quantity = (amount / 1000.0) * concentration;
    }

    let pushedId: string | number = id;
    if (lData) {
      for (let i = 1; i <= 4; i++) {
        if (lData['beaker' + i] === id) {
          pushedId = i;
          break;
        }
      }
    }
    setSelectedBeakers(prev => [...prev, pushedId]);

    const colors = getColors([pushedId], lData, items);

    let newStack = stack;
    if (colors.length > 0) {
      // Merge only into a token whose OWN current identity matches — never one that
      // merely had this id consumed into it at some earlier point in a reaction chain.
      const idx = stack.findIndex(t => t.id === trueId);
      if (idx > -1) {
        newStack = stack.map((t, i) =>
          i === idx ? { ...t, quantity: (t.quantity || 1.0) + quantity, sourceReactionKey: undefined } : t
        );
      } else {
        newStack = [...stack, { id: trueId, color: colors[0], type: itemType, quantity, _uid: `add-${Date.now()}-${Math.random()}` }];
      }
    }

    visualStackRef.current = newStack;
    setVisualStack(newStack);
    scheduleReactionCheck();
    return true;
  }, [scheduleReactionCheck]);

  /** Consume an inventory item by adding it to the flask (mirrors window.useItem's lab branch). */
  const useItemInLab = useCallback(
    (itemId: string): boolean => {
      if (!(inventory[itemId] > 0)) return false;
      const result = addLiquid(itemId);
      if (result !== false) {
        removeItemFromInventory(itemId, 1);
      }
      return true;
    },
    [inventory, addLiquid, removeItemFromInventory]
  );

  const clearChain = useCallback(() => {
    chainTokenRef.current += 1;
    isChainRunningRef.current = false;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  /** Empties the flask, returning any inventory-sourced reagents to the player's bag. */
  const resetFlask = useCallback(() => {
    clearChain();
    selectedBeakers.forEach(id => {
      if (typeof id === 'string') {
        addItemToInventory(id, 1);
      }
    });
    setSelectedBeakers([]);
    setVisualStack([]);
    visualStackRef.current = [];
    setCurrentPH(7.0);
    setCurrentTemperature(298);
    setCurrentReactionName('');
  }, [selectedBeakers, addItemToInventory, clearChain]);

  /** Collects everything currently in the flask into the player's inventory. */
  const addFlaskToInventory = useCallback(() => {
    clearChain();
    const stack = visualStackRef.current;
    const lData = labDataRef.current;
    const items = itemsDataRef.current;

    stack.forEach(token => {
      const primaryId = token.id;
      if (primaryId === undefined || primaryId === null) return;

      const beakerKey = !isNaN(Number(primaryId)) ? 'beaker' + primaryId : null;
      const resolvedId = beakerKey && lData && lData[beakerKey] ? lData[beakerKey] : primaryId;
      if (resolvedId === 'Unknown Product') return;

      let item = items.find(i => i.id === resolvedId);
      if (!item) {
        item = {
          id: String(resolvedId),
          name: String(resolvedId),
          use: 'Unknown',
          attributes: {
            type: token.type || 'liquid',
            color: token.color || 'white',
            ph: currentPHRef.current,
            temp: currentTemperatureRef.current,
          },
          script: '',
        };
        registerItem(item);
      }
      addItemToInventory(String(item.id), 1);
    });

    setSelectedBeakers([]);
    setVisualStack([]);
    visualStackRef.current = [];
    setCurrentPH(7.0);
    setCurrentTemperature(298);
    setCurrentReactionName('');
    setCurrentReactionScript('');
    setCurrentProducts([]);
  }, [addItemToInventory, registerItem, clearChain]);

  // Passive cooling toward ambient temperature (298K), active only while the lab is open —
  // mirrors startCooling()/clearInterval in launch()/closelab().
  useEffect(() => {
    if (!isLabVisible) return;
    const interval = setInterval(() => {
      setCurrentTemperature(prev => {
        const ambient = 298;
        const k = 0.002;
        const diff = prev - ambient;
        if (Math.abs(diff) > 0.01) return prev - k * diff;
        return ambient;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isLabVisible]);

  return {
    visualStack,
    selectedBeakers,
    currentPH,
    currentTemperature,
    currentReactionName,
    currentProductName,
    currentReactionScript,
    currentProductType,
    currentProductColor,
    currentProducts,
    flaskActive,
    addLiquid,
    useItemInLab,
    resetFlask,
    addFlaskToInventory,
  };
};
