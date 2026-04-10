export type ViewName = 'town' | 'map' | 'battle' | 'reward';
export type BattleOutcome = 'victory' | 'defeat';
export type RoomKind = 'battle' | 'elite' | 'event' | 'treasure' | 'blessing' | 'boss' | 'rest';
export type BattleSkillId = 'attack' | 'heavyStrike' | 'guard' | 'rend' | 'attackPlus2' | 'attackPlus3' | 'attackPlus4';
export type CharacterClassId = 'warrior' | 'rogue' | 'mage';
export type BattleSkillTag = CharacterClassId | 'bleed' | 'poison' | 'block' | 'strike';

export type BattleStatusEffectKind = 'poison' | 'bleed';

export interface BattleStatusEffect {
  kind: BattleStatusEffectKind;
  value: number;
  duration: number;
}

// 一组可复用的基础战斗属性。
export interface CharacterStats {
  hp: number;
  maxHp: number;
  strength: number;
  agility: number;
}

// 玩家角色的核心数据。
export interface Character {
  id: string;
  name: string;
  classId: CharacterClassId;
  level: number;
  gold: number;
  block: number;
  statusEffects: BattleStatusEffect[];
  stats: CharacterStats;
}

// 敌人数据，额外包含战斗胜利奖励。
export interface Enemy {
  id: string;
  name: string;
  block: number;
  statusEffects: BattleStatusEffect[];
  stats: CharacterStats;
  rewardGold: number;
}

export interface BattleSkillExtraEffect {
  kind: BattleStatusEffectKind;
  target: 'hero' | 'enemy';
  value: number;
  duration?: number;
}

export interface BattleSkillEffectContext {
  hero: Character;
  enemy: Enemy;
  baseHeroDamage: number;
  baseEnemyDamage: number;
}

export interface BattleSkillEffectResult {
  heroDamage: number;
  heroBlockGain: number;
  enemyDamageMultiplier?: number;
  enemyBonusDamage?: number;
  extraEffects?: BattleSkillExtraEffect[];
  summary: string;
}

export type BattleSkillTemplateId = 'attack' | 'gainBlock';

export interface BattleSkillModifier {
  cooldownOffset?: number;
  damageMultiplierBonus?: number;
  bonusDamage?: number;
  blockGainBonus?: number;
  extraEffects?: BattleSkillExtraEffect[];
}

export type BattleSkillRuntimeState = Partial<Record<BattleSkillId, BattleSkillModifier>>;

export interface BattleSkillNumbers {
  damageMultiplier?: number;
  bonusDamage?: number;
  blockGain?: number;
  extraEffects?: BattleSkillExtraEffect[];
}

export interface BattleSkillDefinition {
  id: BattleSkillId;
  label: string;
  description: string;
  classId: CharacterClassId;
  tags: BattleSkillTag[];
  cooldown: number;
  template: BattleSkillTemplateId;
  numbers: BattleSkillNumbers;
}

export interface BattleRoundResult {
  heroSkillId: BattleSkillId;
  heroDamage: number;
  enemyDamage: number;
  heroBlockGain: number;
  heroRemainingHp: number;
  enemyRemainingHp: number;
  heroRemainingBlock: number;
  enemyRemainingBlock: number;
  heroStatusEffects: BattleStatusEffect[];
  enemyStatusEffects: BattleStatusEffect[];
  actionSummary: string;
  logTexts: string[];
}

export type BattleCooldownState = Record<BattleSkillId, number>;

// 兼容当前玩法流程的线性房间结构。
export interface Room {
  id: string;
  depth: number;
  label: string;
  kind: RoomKind;
  cleared: boolean;
}

// 地图图结构中的单个节点。
export interface MapNodeData {
  id: string;
  layer: number;
  column: number;
  x: number;
  y: number;
  label: string;
  kind: RoomKind;
  cleared: boolean;
}

// 地图中两个节点之间的一条连线。
export interface MapEdge {
  fromNodeId: string;
  toNodeId: string;
}

// 一整张分层地图的基础骨架数据。
export interface GeneratedMap {
  nodes: MapNodeData[];
  edges: MapEdge[];
  startNodeId: string;
  bossNodeId: string;
  width: number;
  height: number;
}

// 战斗日志中的一条记录。
export interface BattleLogEntry {
  id: string;
  text: string;
}

// 奖励页中可供选择的一项奖励。
export interface RewardChoice {
  id: string;
  label: string;
  description: string;
  gold: number;
  maxHpBoost: number;
  strengthBoost: number;
  heal: number;
  grantedSkillId?: BattleSkillId;
}

// 奖励页使用的轻量结算结构。
export interface BattleSummary {
  rounds: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  remainingHp: number;
}

export interface BattleReward {
  outcome: BattleOutcome;
  nodeId: string;
  kind: RoomKind;
  title: string;
  description: string;
  gold: number;
  maxHpBoost: number;
  strengthBoost: number;
  heal: number;
  grantedSkillId?: BattleSkillId;
  choices?: RewardChoice[];
  battleSummary?: BattleSummary;
}
