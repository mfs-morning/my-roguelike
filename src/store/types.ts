// 集中定义 store 使用的数据状态、动作接口与状态迁移 patch 类型。
import type {
  BattleCooldownState,
  BattleLogEntry,
  BattleReward,
  BattleSkillId,
  BattleSkillModifier,
  BattleSkillRuntimeState,
  BattleSummary,
  BattleTacticCondition,
  BattleTacticSlot,
  Character,
  Enemy,
  GeneratedMap,
  RunRelic,
  ViewName,
} from '../types';

export interface GameState {
  currentView: ViewName;
  hero: Character;
  enemy: Enemy;
  backEnemy: Enemy | null;
  relics: RunRelic[];
  generatedMap: GeneratedMap;
  battleLog: BattleLogEntry[];
  activeRoomId: string | null;
  pendingReward: BattleReward | null;
  battleSummary: BattleSummary | null;
  battleTactics: BattleTacticSlot[];
  unlockedBattleSkills: BattleSkillId[];
  battleSkillDropChance: number;
  battleCooldowns: BattleCooldownState;
  battleSkillRuntimeState: BattleSkillRuntimeState;
  setView: (view: ViewName) => void;
  resetRun: () => void;
  selectRoom: (roomId: string) => void;
  moveBattlePriority: (skillId: BattleSkillId, direction: 'up' | 'down') => void;
  reorderBattlePriority: (fromSkillId: BattleSkillId, toSkillId: BattleSkillId) => void;
  setBattleTacticCondition: (skillId: BattleSkillId, condition: BattleTacticCondition) => void;
  enableBattleSkill: (skillId: BattleSkillId) => void;
  disableBattleSkill: (skillId: BattleSkillId) => void;
  upgradeBattleSkill: (skillId: BattleSkillId, modifier: BattleSkillModifier) => void;
  runBattleRound: () => void;
  claimReward: (choiceId?: string) => void;
}

export type SelectRoomState = Pick<GameState, 'generatedMap' | 'hero' | 'relics'>;

export type ClaimRewardState = Pick<
  GameState,
  'pendingReward' | 'generatedMap' | 'hero' | 'unlockedBattleSkills' | 'battleTactics' | 'backEnemy' | 'battleLog' | 'relics'
>;

export type BattleRoundState = Pick<
  GameState,
  | 'currentView'
  | 'activeRoomId'
  | 'pendingReward'
  | 'hero'
  | 'enemy'
  | 'backEnemy'
  | 'generatedMap'
  | 'battleTactics'
  | 'battleCooldowns'
  | 'battleSkillRuntimeState'
  | 'battleLog'
  | 'battleSummary'
  | 'unlockedBattleSkills'
  | 'relics'
  | 'battleSkillDropChance'
>;

export type BattleEntryPatch = Pick<
  GameState,
  | 'activeRoomId'
  | 'hero'
  | 'enemy'
  | 'backEnemy'
  | 'battleSummary'
  | 'battleLog'
  | 'currentView'
  | 'pendingReward'
  | 'battleCooldowns'
  | 'battleSkillRuntimeState'
>;

export type BattleOngoingPatch = Pick<
  GameState,
  'hero' | 'enemy' | 'backEnemy' | 'battleSummary' | 'battleLog' | 'battleCooldowns'
>;

export type BattleVictoryPatch = Pick<
  GameState,
  | 'hero'
  | 'enemy'
  | 'backEnemy'
  | 'battleLog'
  | 'battleSummary'
  | 'battleCooldowns'
  | 'battleSkillDropChance'
  | 'pendingReward'
  | 'currentView'
>;

export type BattleDefeatPatch = Pick<
  GameState,
  'hero' | 'enemy' | 'backEnemy' | 'battleLog' | 'battleSummary' | 'battleCooldowns' | 'pendingReward' | 'currentView'
>;

export type BattleRoundPatch = BattleOngoingPatch | BattleVictoryPatch | BattleDefeatPatch;

export type RewardClaimPatch = Pick<
  GameState,
  | 'hero'
  | 'generatedMap'
  | 'activeRoomId'
  | 'pendingReward'
  | 'battleSummary'
  | 'currentView'
  | 'enemy'
  | 'backEnemy'
  | 'battleTactics'
  | 'unlockedBattleSkills'
  | 'battleCooldowns'
  | 'battleSkillRuntimeState'
  | 'battleLog'
>;

