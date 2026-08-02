import { PlayerStats, RollResult } from '../types/game';

/**
 * Generate 6 DnD stats that total 72
 */
export const generateStatsTo72 = (): PlayerStats => {
  const stats = [12, 12, 12, 12, 12, 12];
  for (let i = 0; i < 150; i++) {
    const i1 = Math.floor(Math.random() * 6);
    const i2 = Math.floor(Math.random() * 6);
    if (i1 === i2) continue;
    const dir = Math.random() > 0.5 ? 1 : -1;
    if (
      stats[i1] + dir >= 1 &&
      stats[i1] + dir <= 20 &&
      stats[i2] - dir >= 1 &&
      stats[i2] - dir <= 20
    ) {
      stats[i1] += dir;
      stats[i2] -= dir;
    }
  }
  return {
    STR: stats[0],
    DEX: stats[1],
    CON: stats[2],
    INT: stats[3],
    WIS: stats[4],
    CHA: stats[5],
  };
};

/**
 * Calculate DnD stat modifier: floor((stat - 10) / 2)
 */
export const getStatModifier = (statValue: number): number => {
  return Math.floor((statValue - 10) / 2);
};

interface RollOptions {
  diceType: string;
  statName?: keyof PlayerStats;
  playerStats?: PlayerStats;
  dc?: number;
  advantage?: boolean | null;
}

/**
 * Roll dice calculation logic
 */
export const executeRoll = ({
  diceType,
  statName,
  playerStats,
  dc,
  advantage,
}: RollOptions): RollResult => {
  const parts = diceType.toLowerCase().split('d');
  const numDice = parseInt(parts[0], 10) || 1;
  const numSides = parseInt(parts[1], 10) || 20;

  const statValue = statName && playerStats ? playerStats[statName] : undefined;
  const modifier = statValue !== undefined ? getStatModifier(statValue) : 0;

  const doRoll = () => {
    let sum = 0;
    const rolls: number[] = [];
    for (let i = 0; i < numDice; i++) {
      const r = Math.floor(Math.random() * numSides) + 1;
      rolls.push(r);
      sum += r;
    }
    return { sum, rolls };
  };

  let resultObj: { sum: number; rolls: number[]; dropped?: number };
  let finalRoll = 0;
  let rollType: 'Normal' | 'Advantage' | 'Disadvantage' = 'Normal';

  if (advantage === true) {
    rollType = 'Advantage';
    const r1 = doRoll();
    const r2 = doRoll();
    if (r1.sum >= r2.sum) {
      finalRoll = r1.sum;
      resultObj = { ...r1, dropped: r2.sum };
    } else {
      finalRoll = r2.sum;
      resultObj = { ...r2, dropped: r1.sum };
    }
  } else if (advantage === false) {
    rollType = 'Disadvantage';
    const r1 = doRoll();
    const r2 = doRoll();
    if (r1.sum <= r2.sum) {
      finalRoll = r1.sum;
      resultObj = { ...r1, dropped: r2.sum };
    } else {
      finalRoll = r2.sum;
      resultObj = { ...r1, dropped: r2.sum };
    }
  } else {
    const r1 = doRoll();
    finalRoll = r1.sum;
    resultObj = r1;
  }

  let passed: boolean | null = null;
  if (finalRoll === 20 && numSides === 20) {
    passed = true;
  } else if (finalRoll === 1 && numSides === 20) {
    passed = false;
  } else if (typeof dc === 'number') {
    passed = finalRoll + modifier >= dc;
  }

  const total = finalRoll + modifier;

  return {
    diceType,
    stat: statName,
    dc,
    advantage,
    total,
    passed,
    rolls: resultObj.rolls,
    dropped: resultObj.dropped,
    statValue,
    modifier,
    rollType,
  };
};
