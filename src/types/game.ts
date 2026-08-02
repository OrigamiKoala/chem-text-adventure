export interface NarrativeNode {
  id: string;
  text: string;
  type?: string;
  next?: string | null;
  roll?: string | null;
  success?: string | null;
  fail?: string | null;
  correct?: string | null;
  hint?: string | null;
  hint2?: string | null;
  op1?: string | null;
  op2?: string | null;
  op3?: string | null;
  op4?: string | null;
  conditional?: boolean | string | null;
  altcorrect?: string | null;
}

export interface OutlineItem {
  div: string;
  reference_num: string | number;
  content: string;
}

export interface ItemAttributes {
  color?: string;
  type?: string;
  state?: string;
  ph?: number;
  [key: string]: any;
}

export interface ItemData {
  id: string;
  name: string;
  type?: string;
  attributes?: ItemAttributes;
  description?: string;
  script?: string;
  hidden?: boolean;
  color?: string;
  M?: number | string;
  ph?: number | string;
  Ka?: number | string;
  Kb?: number | string;
  c?: number | string;
  initialMoles?: number | string;
  density?: number | string;
  heatCapacity?: number | string;
  [key: string]: any;
}

export interface LabData {
  labid: string;
  reaction?: string;
  solidcolor?: string;
  temp?: string | number;
  [key: string]: any; // beaker1..N, attributes1..N
}

export interface FullGameData {
  narrative_nodes: NarrativeNode[];
  active_narrative_outline?: OutlineItem[];
  items?: ItemData[];
  labs?: LabData[];
  [key: string]: any;
}

export interface PlayerStats {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIS: number;
  CHA: number;
}

export interface ChatMessage {
  id: string;
  sender: 'game' | 'player' | 'system' | 'roll';
  text: string;
  timestamp: number;
  nodeId?: string;
  rollData?: RollResult;
}

export interface RollResult {
  diceType: string;
  stat?: keyof PlayerStats;
  dc?: number;
  advantage?: boolean | null;
  total: number;
  passed?: boolean | null;
  rolls: number[];
  dropped?: number;
  statValue?: number;
  modifier?: number;
  rollType: 'Normal' | 'Advantage' | 'Disadvantage';
}

export interface InventoryMap {
  [itemId: string]: number;
}

/** A single "slot" in the flask's visual stack, identified by its own current chemical id. */
export interface FlaskToken {
  id: string | number;
  type: string;
  color: string;
  quantity: number;
  isProduct?: boolean;
  toRemove?: boolean;
  /** Internal stable identity (not present in the original) used to track a token
   * instance across immutable state updates, e.g. for the 4s ephemeral-gas fade. */
  _uid?: string;
  /** isProduct tokens only: the reactionEngine reactionKey that produced this token.
   * Used only by determineNextReaction's loop-prevention check, never for identity
   * matching. Cleared when fresh reagent is merged into the token (see addLiquid). */
  sourceReactionKey?: string | null;
}

export type FlaskInput = string | number | { id: string | number; qty?: number };

/** Result of matching flask contents against a lab's `reaction` rules (mirrors original getFlaskState). */
export interface FlaskReactionState {
  ph: number;
  temp: number;
  reactionName: string;
  visualColors: string[];
  productType: string | null;
  productColor?: string;
  productName?: string;
  reactionKey: string | null;
  reactingIndices: (string | number)[];
  limitingYield: number;
  isEquilibrium: boolean;
  direction: string;
  K: number | null;
  outcome: any;
  products?: any[];
  script?: string;
  triggerConditional?: boolean;
  reactantList?: string[];
  productList?: string[];
}
