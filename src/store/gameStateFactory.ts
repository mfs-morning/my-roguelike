// 构建整局初始状态以及开局时需要复用的克隆/工厂函数。
import {
  createBattleCooldownState,
  defaultBattleTactics,
  defaultUnlockedBattleSkills,
  starterEnemy,
  starterHero,
} from '../core/config/constants';
import { generateMapSkeleton } from '../core/map/generator';
import type {
  BattleCooldownState,
  BattleLogEntry,
  BattleSkillId,
  BattleSkillRuntimeState,
  BattleSummary,
  BattleTacticSlot,
  Character,
  Enemy,
  ViewName,
} from '../types';

// 深拷贝初始英雄，避免运行态状态污染常量。
export function cloneHero() {
  return structuredClone(starterHero) as Character;
}

// 深拷贝初始敌人模板，用于生成新的战斗目标。
export function cloneEnemy() {
  return structuredClone(starterEnemy) as Enemy;
}

// 复制默认战术槽顺序，保证每局运行独立。
export function cloneBattleTactics() {
  return structuredClone(defaultBattleTactics) as BattleTacticSlot[];
}

// 复制默认已解锁技能列表。
export function cloneUnlockedBattleSkills() {
  return [...defaultUnlockedBattleSkills] as BattleSkillId[];
}

// 创建一份新的技能冷却表，供当前战斗使用。
export function cloneBattleCooldowns() {
  return createBattleCooldownState() as BattleCooldownState;
}

// 创建一份新的局内技能修正表，默认所有技能都使用基础模板。
export function cloneBattleSkillRuntimeState() {
  return {} as BattleSkillRuntimeState;
}

// 初始化一场战斗的统计摘要。
export function createEmptyBattleSummary(): BattleSummary {
  return {
    rounds: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    remainingHp: 0,
  };
}

export interface GameBaseState {
  currentView: ViewName;
  hero: Character;
  enemy: Enemy;
  backEnemy: Enemy | null;
  battleLog: BattleLogEntry[];
  activeRoomId: string | null;
  pendingReward: null;
  battleSummary: BattleSummary | null;
  battleTactics: BattleTacticSlot[];
  unlockedBattleSkills: BattleSkillId[];
  battleSkillDropChance: number;
  battleCooldowns: BattleCooldownState;
  battleSkillRuntimeState: BattleSkillRuntimeState;
}

// 创建整局游戏的初始状态。
export function buildInitialState(initialSkillDropChance: number): GameBaseState & { generatedMap: ReturnType<typeof generateMapSkeleton> } {
  return {
    currentView: 'town' as ViewName,
    hero: cloneHero(),
    enemy: cloneEnemy(),
    backEnemy: null,
    generatedMap: generateMapSkeleton(),
    battleLog: [{ id: 'log-1', text: '新的冒险开始了。' }],
    activeRoomId: null,
    pendingReward: null,
    battleSummary: null,
    battleTactics: cloneBattleTactics(),
    unlockedBattleSkills: cloneUnlockedBattleSkills(),
    battleSkillDropChance: initialSkillDropChance,
    battleCooldowns: cloneBattleCooldowns(),
    battleSkillRuntimeState: cloneBattleSkillRuntimeState(),
  };
}

