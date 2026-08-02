import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FullGameData,
  NarrativeNode,
  ItemData,
  PlayerStats,
  ChatMessage,
  InventoryMap,
  RollResult,
  LabFlaskState,
} from '../types/game';
import { generateStatsTo72, executeRoll } from '../engine/diceEngine';
import { cleanTeX, checkNumericAnswer, findItem, safeTypeset } from '../engine/textParser';
import { computeFlaskState } from '../engine/reactionEngine';
import rawData from '../../data.json';

export const useGameEngine = () => {
  const gameData = (rawData as unknown) as FullGameData;

  const [currentId, setCurrentId] = useState<string>('initial');
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [playerHP, setPlayerHP] = useState<number>(100);
  const [maxHP] = useState<number>(100);
  const [hpLossRate, setHpLossRate] = useState<number>(0);
  const [playerStats, setPlayerStats] = useState<PlayerStats>(generateStatsTo72());
  const [inventory, setInventory] = useState<InventoryMap>({});
  const [itemsData] = useState<ItemData[]>(gameData.items || []);
  const [helpText, setHelpText] = useState<string>('');

  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [activeRoll, setActiveRoll] = useState<RollResult | null>(null);

  const [flaskContents, setFlaskContents] = useState<string[]>([]);
  const [labFlaskState, setLabFlaskState] = useState<LabFlaskState>(
    computeFlaskState([], gameData.items || [])
  );

  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState<boolean>(false);
  const [isPeriodicTableOpen, setIsPeriodicTableOpen] = useState<boolean>(false);
  const [periodicTableVersion, setPeriodicTableVersion] = useState<number>(1);
  const [isOutlineOpen, setIsOutlineOpen] = useState<boolean>(false);
  const [isLabVisible, setIsLabVisible] = useState<boolean>(false);

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
      const nextHP = Math.min(maxHP, prev + amount);
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

  // Flask / Lab simulation operations
  const addLiquidToFlask = useCallback(
    (itemId: string) => {
      setFlaskContents(prev => {
        const updated = [...prev, itemId];
        setLabFlaskState(computeFlaskState(updated, itemsData));
        return updated;
      });
    },
    [itemsData]
  );

  const resetFlask = useCallback(() => {
    setFlaskContents([]);
    setLabFlaskState(computeFlaskState([], itemsData));
  }, [itemsData]);

  const mixFlask = useCallback(() => {
    setLabFlaskState(prev => ({
      ...prev,
      pH: Math.max(0, Math.min(14, prev.pH + (Math.random() * 0.2 - 0.1))),
    }));
  }, []);

  const heatFlask = useCallback(() => {
    setLabFlaskState(prev => ({
      ...prev,
      temperature: prev.temperature + 10,
    }));
  }, []);

  const coolFlask = useCallback(() => {
    setLabFlaskState(prev => ({
      ...prev,
      temperature: Math.max(273.15, prev.temperature - 10),
    }));
  }, []);

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

      if (!currentNode) return;

      let nextNodeId: string | null = currentNode.next || null;

      // MCQ options matching
      if (currentNode.type === 'mcq') {
        if (input === '1' || lower === currentNode.op1?.toLowerCase()) {
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

      if (nextNodeId && gameData.narrative_nodes.some(n => n.id === nextNodeId)) {
        jumpTo(nextNodeId);
      } else if (currentNode.next && gameData.narrative_nodes.some(n => n.id === currentNode.next)) {
        jumpTo(currentNode.next);
      }
    },
    [currentNode, gameData.narrative_nodes, helpText, jumpTo]
  );

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
    flaskContents,
    labFlaskState,
    isInventoryModalOpen,
    isPeriodicTableOpen,
    periodicTableVersion,
    isOutlineOpen,
    isLabVisible,
    changeHP,
    addItemToInventory,
    removeItemFromInventory,
    jumpTo,
    rollDice,
    addLiquidToFlask,
    resetFlask,
    mixFlask,
    heatFlask,
    coolFlask,
    handleInput,
    setIsInventoryModalOpen,
    setIsPeriodicTableOpen,
    setPeriodicTableVersion,
    setIsOutlineOpen,
    setIsLabVisible,
  };
};
