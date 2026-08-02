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

export interface FullGameData {
  narrative_nodes: NarrativeNode[];
  active_narrative_outline?: OutlineItem[];
  items?: ItemData[];
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

export interface BeakerItem {
  id: string;
  name: string;
  color: string;
  type: string; // 'liquid' | 'solid' | 'gas'
  qty: number; // in moles or L
  ph?: number;
  M?: number;
}

export interface FlaskLiquidLayer {
  id: string;
  name: string;
  color: string;
  volumePercent: number;
  moles: number;
  ph?: number;
}

export interface LabFlaskState {
  liquids: FlaskLiquidLayer[];
  solid?: {
    type: string;
    color: string;
    name?: string;
  } | null;
  gas?: {
    type: string;
    color: string;
    isProductGas?: boolean;
    bubbleColor?: string;
  } | null;
  temperature: number; // Kelvin or Celsius (default ~298.15K)
  pressure: number; // atm
  totalVolume: number; // Liters
  pH: number;
  moles: number;
}

export interface InventoryMap {
  [itemId: string]: number;
}
