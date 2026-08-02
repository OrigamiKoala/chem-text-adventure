import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FullGameData,
  NarrativeNode,
  ItemData,
  PlayerStats,
  ChatMessage,
  InventoryMap,
  RollResult,
} from '../types/game';
import { generateStatsTo72, executeRoll } from '../engine/diceEngine';
import {
  cleanTeX,
  checkNumericAnswer,
  findItem,
  safeTypeset,
  parseDivChunks,
  processTextScripts,
  executeItemScript,
  extractOptionsAndCleanText,
  parseAndExecuteRoll,
} from '../engine/textParser';
import { useLabEngine } from './useLabEngine';
import rawData from '../../data.json';

const SAVE_KEY = 'chem_adventure_save_v2';

interface SavedGameState {
  currentId: string;
  historyStack: string[];
  playerHP: number;
  playerStats: PlayerStats;
  inventory: InventoryMap;
  chatLog: ChatMessage[];
  currentLab?: string;
}

const loadSavedGameState = (): SavedGameState | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.currentId === 'string') {
      return parsed as SavedGameState;
    }
  } catch (err) {
    console.warn('Failed to load saved game state:', err);
  }
  return null;
};

export const useGameEngine = () => {
  const gameData = (rawData as unknown) as FullGameData;

  const savedState = useRef<SavedGameState | null>(loadSavedGameState());

  const [currentId, setCurrentId] = useState<string>(
    () => savedState.current?.currentId || 'initial'
  );
  const [historyStack, setHistoryStack] = useState<string[]>(
    () => savedState.current?.historyStack || []
  );
  const [playerHP, setPlayerHP] = useState<number>(
    () => savedState.current?.playerHP ?? 100
  );
  const [maxHP] = useState<number>(100);
  const [hpLossRate, setHpLossRate] = useState<number>(0);
  const [playerStats, setPlayerStats] = useState<PlayerStats>(
    () => savedState.current?.playerStats || generateStatsTo72()
  );
  const [inventory, setInventory] = useState<InventoryMap>(
    () => savedState.current?.inventory || {}
  );
  const [itemsData, setItemsData] = useState<ItemData[]>(gameData.items || []);
  const [helpText, setHelpText] = useState<string>('');

  const [chatLog, setChatLog] = useState<ChatMessage[]>(
    () => savedState.current?.chatLog || []
  );
  const [activeRoll, setActiveRoll] = useState<RollResult | null>(null);

  const [currentLab, setCurrentLab] = useState<string>(
    () => savedState.current?.currentLab || 'reactions'
  );
  const [conditionalMet, setConditionalMet] = useState<boolean>(false);

  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState<boolean>(false);
  const [isPeriodicTableOpen, setIsPeriodicTableOpen] = useState<boolean>(false);
  const [periodicTableVersion, setPeriodicTableVersion] = useState<number>(1);
  const [isOutlineOpen, setIsOutlineOpen] = useState<boolean>(false);
  const [isLabVisible, setIsLabVisible] = useState<boolean>(false);

  // Auto-save game progress to localStorage
  useEffect(() => {
    try {
      const stateToSave: SavedGameState = {
        currentId,
        historyStack,
        playerHP,
        playerStats,
        inventory,
        chatLog,
        currentLab,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(stateToSave));
    } catch (err) {
      console.warn('Failed to save game state:', err);
    }
  }, [currentId, historyStack, playerHP, playerStats, inventory, chatLog, currentLab]);

  // Preload help text
  useEffect(() => {
    fetch('/help.txt')
      .then(res => res.text())
      .then(text => setHelpText(text))
      .catch(() => setHelpText('Help text unavailable.'));
  }, []);

  // Passive HP loss timer
  useEffect(() => {
    if (hpLossRate <= 0) return;
    const timer = setInterval(() => {
      setPlayerHP(prev => {
        const nextHP = Math.max(0, prev - hpLossRate);
        return nextHP;
      });
    }, 30000);
    return () => clearInterval(timer);
  }, [hpLossRate]);

  // Current Node
  const currentNode: NarrativeNode | undefined = gameData.narrative_nodes.find(
    n => n.id === currentId
  );

  // HP Change helper
  const changeHP = useCallback((amount: number) => {
    setPlayerHP(prev => {
      const nextHP = Math.min(maxHP, Math.max(0, prev + amount));
      return nextHP;
    });
  }, [maxHP]);

  // Inventory helpers
  const addItemToInventory = useCallback((itemId: string, qty = 1) => {
    setInventory(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + qty,
    }));
  }, []);

  const removeItemFromInventory = useCallback((itemId: string, qty = 1) => {
    setInventory(prev => {
      const current = prev[itemId] || 0;
      if (current <= qty) {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      }
      return {
        ...prev,
        [itemId]: current - qty,
      };
    });
  }, []);

  const modifyStat = useCallback((statName: keyof PlayerStats, amountOrVal: number, isRelative = true) => {
    setPlayerStats(prev => {
      const currentVal = prev[statName] || 10;
      const newVal = isRelative ? Math.max(1, currentVal + amountOrVal) : Math.max(1, amountOrVal);
      return {
        ...prev,
        [statName]: newVal,
      };
    });
  }, []);

  // Registers a newly-formed reaction product as an item, if not already known
  // (mirrors the original pushing auto-generated item defs into window.itemsData).
  const registerItem = useCallback((item: ItemData) => {
    setItemsData(prev => (prev.some(i => i.id === item.id) ? prev : [...prev, item]));
  }, []);

  const currentLabData = gameData.labs?.find(l => l.labid === currentLab);

  const lab = useLabEngine({
    labData: currentLabData,
    itemsData,
    registerItem,
    inventory,
    addItemToInventory,
    removeItemFromInventory,
    isLabVisible,
    onConditionalTrigger: () => setConditionalMet(true),
  });

  // Mirrors window.useItem: if the lab is open, using an item adds it to the flask;
  // otherwise it runs the item's own script (e.g. changeHP(-20)) and is consumed.
  const useItem = useCallback(
    (itemId: string) => {
      if (isLabVisible) {
        lab.useItemInLab(itemId);
        return;
      }
      const item = itemsData.find(i => i.id === itemId);
      if (item && inventory[itemId] > 0) {
        if (item.script) {
          executeItemScript(item.script, {
            changeHP,
            setHP: (hp: number) => setPlayerHP(Math.min(maxHP, Math.max(0, hp))),
            setHPLossRate: (rate: number) => setHpLossRate(rate),
            modifyStat: (statName: string, val: number, isRelative: boolean) => {
              modifyStat(statName.toUpperCase() as keyof PlayerStats, val, isRelative);
            },
            pickup: (name: string) => addItemToInventory(name, 1),
            removeInventory: (name: string, qty?: string | number) =>
              removeItemFromInventory(name, qty === 'all' ? 999 : Number(qty) || 1),
          });
        }
        removeItemFromInventory(itemId, 1);
      }
    },
    [isLabVisible, lab, itemsData, inventory, changeHP, maxHP, modifyStat, addItemToInventory, removeItemFromInventory]
  );

  // Jump to Node
  const jumpTo = useCallback((nodeId: string) => {
    setHistoryStack(prev => [...prev, currentId]);
    setCurrentId(nodeId);
  }, [currentId]);

  // Roll Dice helper
  const rollDice = useCallback(
    (diceType: string, statName?: keyof PlayerStats, dc?: number, advantage?: boolean | null) => {
      const result = executeRoll({
        diceType,
        statName,
        playerStats,
        dc,
        advantage,
      });

      setActiveRoll(result);

      // Append roll to chat log
      setChatLog(prev => [
        ...prev,
        {
          id: 'roll-' + Date.now(),
          sender: 'roll',
          text: `Rolled ${result.total} for ${diceType}`,
          timestamp: Date.now(),
          rollData: result,
        },
      ]);

      return result;
    },
    [playerStats]
  );

  const lastProcessedIdRef = useRef<string | null>(null);

  // Process embedded <script> tags and append narration messages to chat log when currentNode changes
  useEffect(() => {
    if (!currentNode?.text) return;

    const { cleanText: textNoOptions } = extractOptionsAndCleanText(currentNode);
    const { cleanText } = processTextScripts(textNoOptions, {
      changeHP,
      setHP: (hp: number) => setPlayerHP(Math.min(maxHP, Math.max(0, hp))),
      setHPLossRate: (rate: number) => setHpLossRate(rate),
      modifyStat: (statName: string, val: number, isRelative: boolean) => {
        const s = statName.toUpperCase() as keyof PlayerStats;
        modifyStat(s, val, isRelative);
      },
      pickup: (item: string) => addItemToInventory(item, 1),
      removeInventory: (item: string, qty?: string | number) =>
        removeItemFromInventory(item, qty === 'all' ? 999 : Number(qty) || 1),
      setLabVisible: (visible: boolean) => setIsLabVisible(visible),
      setLab: (labName: string) => {
        if (labName) setCurrentLab(labName);
        setIsLabVisible(true);
      },
      roll: (diceType: string, statName?: string, dc?: number, advantage?: boolean) => {
        rollDice(diceType, statName as keyof PlayerStats, dc, advantage);
      },
    });

    if (lastProcessedIdRef.current !== currentId) {
      lastProcessedIdRef.current = currentId;

      const chunks = parseDivChunks(cleanText);
      const newMessages: ChatMessage[] = chunks.map((chunk, idx) => ({
        id: `narration-${currentId}-${idx}-${Date.now()}`,
        sender: 'game',
        text: chunk,
        timestamp: Date.now() + idx,
        nodeId: currentId,
      }));

      setChatLog(prev => [...prev, ...newMessages]);

      // If this is a roll node, execute roll automatically
      if (currentNode.roll || currentNode.type === 'roll') {
        const rollStr = currentNode.roll || 'roll("1d20")';
        const res = parseAndExecuteRoll(rollStr, (diceType, statName, dc, advantage) =>
          rollDice(diceType, statName as keyof PlayerStats, dc, advantage)
        );

        if (res) {
          const targetNext = (res.passed !== false)
            ? currentNode.success || currentNode.next
            : currentNode.fail || currentNode.next;

          if (targetNext) {
            setTimeout(() => {
              jumpTo(targetNext);
            }, 1200);
          }
        }
      }
    }
  }, [currentId, currentNode, changeHP, addItemToInventory, removeItemFromInventory, modifyStat, maxHP, rollDice, jumpTo]);

  // Submit Answer / Player Input Logic
  const handleInput = useCallback(
    (rawInput: string) => {
      const input = rawInput.trim();
      if (!input) return;

      // Add player response to chat log
      setChatLog(prev => [
        ...prev,
        {
          id: 'msg-' + Date.now(),
          sender: 'player',
          text: input,
          timestamp: Date.now(),
        },
      ]);

      const lower = input.toLowerCase();

      // Lab command toggle
      if (lower === 'lab') {
        setIsLabVisible(prev => {
          const nextState = !prev;
          setChatLog(log => [
            ...log,
            {
              id: 'lab-toggle-' + Date.now(),
              sender: 'system',
              text: nextState
                ? '🧪 Laboratory split screen opened. Type "lab" again to hide.'
                : '🧪 Laboratory workspace closed.',
              timestamp: Date.now(),
            },
          ]);
          return nextState;
        });
        return;
      }

      // Help command
      if (lower === 'help') {
        setChatLog(prev => [
          ...prev,
          {
            id: 'help-' + Date.now(),
            sender: 'system',
            text: helpText || 'Type options or numeric answers to progress through the story.',
            timestamp: Date.now(),
          },
        ]);
        return;
      }

      // Reset / Restart command
      if (lower === 'restart' || lower === 'reset') {
        restartGame();
        return;
      }

      if (!currentNode) return;

      let nextNodeId: string | null = currentNode.next || null;

      // MCQ options matching
      if (currentNode.type === 'mcq') {
        const { choices } = extractOptionsAndCleanText(currentNode);
        const matchChoice = choices.find(
          c =>
            input === String(c.num) ||
            lower === c.text.toLowerCase() ||
            (c.targetNodeId && lower === c.targetNodeId.toLowerCase())
        );

        if (matchChoice) {
          nextNodeId = matchChoice.targetNodeId || currentNode.next || null;
        } else if (input === '1' || lower === currentNode.op1?.toLowerCase()) {
          nextNodeId = currentNode.op1 || currentNode.next || null;
        } else if (input === '2' || lower === currentNode.op2?.toLowerCase()) {
          nextNodeId = currentNode.op2 || currentNode.next || null;
        } else if (input === '3' || lower === currentNode.op3?.toLowerCase()) {
          nextNodeId = currentNode.op3 || currentNode.next || null;
        } else if (input === '4' || lower === currentNode.op4?.toLowerCase()) {
          nextNodeId = currentNode.op4 || currentNode.next || null;
        }
      }

      // Free response (FR) or Numeric response check
      if (currentNode.type === 'fr' || currentNode.type === 'numeric') {
        if (currentNode.correct) {
          const isCorrect =
            lower === currentNode.correct.toLowerCase() ||
            (currentNode.altcorrect && lower === currentNode.altcorrect.toLowerCase()) ||
            checkNumericAnswer(input, currentNode.correct);

          if (isCorrect) {
            nextNodeId = currentNode.next || null;
          } else if (currentNode.fail) {
            nextNodeId = currentNode.fail;
          }
        }
      }

      // Roll node check
      if (currentNode.type === 'roll' || currentNode.roll) {
        const rollStr = currentNode.roll || 'roll("1d20")';
        const res = parseAndExecuteRoll(rollStr, (diceType, statName, dc, advantage) =>
          rollDice(diceType, statName as keyof PlayerStats, dc, advantage)
        );

        if (res) {
          nextNodeId = res.passed !== false
            ? currentNode.success || currentNode.next || null
            : currentNode.fail || currentNode.next || null;
        }
      }

      if (nextNodeId && gameData.narrative_nodes.some(n => n.id === nextNodeId)) {
        jumpTo(nextNodeId);
      } else if (currentNode.next && gameData.narrative_nodes.some(n => n.id === currentNode.next)) {
        jumpTo(currentNode.next);
      }
    },
    [currentNode, gameData.narrative_nodes, helpText, jumpTo]
  );

  const restartGame = useCallback(() => {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (err) {}
    lastProcessedIdRef.current = null;
    setCurrentId('initial');
    setHistoryStack([]);
    setPlayerHP(100);
    setPlayerStats(generateStatsTo72());
    setInventory({});
    setChatLog([]);
  }, []);

  return {
    gameData,
    currentId,
    currentNode,
    historyStack,
    playerHP,
    maxHP,
    playerStats,
    inventory,
    itemsData,
    chatLog,
    activeRoll,
    isInventoryModalOpen,
    isPeriodicTableOpen,
    periodicTableVersion,
    isOutlineOpen,
    isLabVisible,
    currentLab,
    currentLabData,
    conditionalMet,
    setCurrentLab,
    changeHP,
    addItemToInventory,
    removeItemFromInventory,
    jumpTo,
    rollDice,
    useItem,
    // Lab flask engine (visualStack-based; see useLabEngine)
    visualStack: lab.visualStack,
    currentPH: lab.currentPH,
    currentTemperature: lab.currentTemperature,
    currentReactionName: lab.currentReactionName,
    currentProductName: lab.currentProductName,
    flaskActive: lab.flaskActive,
    addLiquid: lab.addLiquid,
    resetFlask: lab.resetFlask,
    addFlaskToInventory: lab.addFlaskToInventory,
    handleInput,
    restartGame,
    setIsInventoryModalOpen,
    setIsPeriodicTableOpen,
    setPeriodicTableVersion,
    setIsOutlineOpen,
    setIsLabVisible,
  };
};
