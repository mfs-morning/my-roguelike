import { battleSkills } from '../core/skills';
import { create } from 'zustand';
import {
  createBattleCooldownState,
  defaultBattlePriority,
  defaultUnlockedBattleSkills,
  starterEnemy,
  starterHero,
} from '../core/constants';
import { simulateBattleRound } from '../core/engine';
import { generateMapSkeleton } from '../core/generator';
import {
  buildReward,
  INITIAL_SKILL_DROP_CHANCE,
  MAX_SKILL_DROP_CHANCE,
  rollBattleSkillDropChoices,
  SKILL_DROP_CHANCE_STEP,
} from '../core/reward';
import { getNextPlayableNodes, markNodeCleared } from '../core/mapProgress';
import { moveSkill, pickHeroSkill, reorderSkills, updateCooldowns } from '../core/battlePriority';
import type {
  BattleCooldownState,
  BattleLogEntry,
  BattleReward,
  BattleSkillId,
  BattleSkillModifier,
  BattleSkillRuntimeState,
  BattleSummary,
  Character,
  Enemy,
  GeneratedMap,
  ViewName,
} from '../types';

interface GameState {
  currentView: ViewName;
  hero: Character;
  enemy: Enemy;
  generatedMap: GeneratedMap;
  battleLog: BattleLogEntry[];
  activeRoomId: string | null;
  pendingReward: BattleReward | null;
  battleSummary: BattleSummary | null;
  battlePriority: BattleSkillId[];
  unlockedBattleSkills: BattleSkillId[];
  battleSkillDropChance: number;
  battleCooldowns: BattleCooldownState;
  battleSkillRuntimeState: BattleSkillRuntimeState;
  setView: (view: ViewName) => void;
  resetRun: () => void;
  selectRoom: (roomId: string) => void;
  moveBattlePriority: (skillId: BattleSkillId, direction: 'up' | 'down') => void;
  reorderBattlePriority: (fromSkillId: BattleSkillId, toSkillId: BattleSkillId) => void;
  enableBattleSkill: (skillId: BattleSkillId) => void;
  disableBattleSkill: (skillId: BattleSkillId) => void;
  upgradeBattleSkill: (skillId: BattleSkillId, modifier: BattleSkillModifier) => void;
  runBattleRound: () => void;
  claimReward: (choiceId?: string) => void;
}

// 深拷贝初始英雄，避免运行态状态污染常量。
function cloneHero() {
  return structuredClone(starterHero) as Character;
}

// 深拷贝初始敌人模板，用于生成新的战斗目标。
function cloneEnemy() {
  return structuredClone(starterEnemy) as Enemy;
}

// 复制默认技能优先级，保证每局运行独立。
function cloneBattlePriority() {
  return [...defaultBattlePriority] as BattleSkillId[];
}

// 复制默认已解锁技能列表。
function cloneUnlockedBattleSkills() {
  return [...defaultUnlockedBattleSkills] as BattleSkillId[];
}

// 创建一份新的技能冷却表，供当前战斗使用。
function cloneBattleCooldowns() {
  return createBattleCooldownState();
}

// 创建一份新的局内技能修正表，默认所有技能都使用基础模板。
function cloneBattleSkillRuntimeState() {
  return {} as BattleSkillRuntimeState;
}

// 从优先级队列中移除指定技能，但不负责最少保留数量校验。
function disableSkillFromPriority(priority: BattleSkillId[], skillId: BattleSkillId) {
  return priority.filter((id) => id !== skillId);
}

// 将新技能加入优先级队列末尾，已存在则保持不变。
function enableSkillToPriority(priority: BattleSkillId[], skillId: BattleSkillId) {
  if (priority.includes(skillId)) {
    return priority;
  }

  return [...priority, skillId];
}

// 将新技能加入解锁池，保持唯一性。
function unlockBattleSkill(unlockedSkills: BattleSkillId[], skillId: BattleSkillId) {
  if (unlockedSkills.includes(skillId)) {
    return unlockedSkills;
  }

  return [...unlockedSkills, skillId];
}

// 将技能强化合并到当前局内状态，适合奖励、事件或遗物带来的即时升级。
function mergeSkillModifier(
  runtimeState: BattleSkillRuntimeState,
  skillId: BattleSkillId,
  modifier: BattleSkillModifier,
): BattleSkillRuntimeState {
  const current = runtimeState[skillId];

  return {
    ...runtimeState,
    [skillId]: {
      cooldownOffset: (current?.cooldownOffset ?? 0) + (modifier.cooldownOffset ?? 0),
      damageMultiplierBonus: (current?.damageMultiplierBonus ?? 0) + (modifier.damageMultiplierBonus ?? 0),
      bonusDamage: (current?.bonusDamage ?? 0) + (modifier.bonusDamage ?? 0),
      blockGainBonus: (current?.blockGainBonus ?? 0) + (modifier.blockGainBonus ?? 0),
      extraEffects: [...(current?.extraEffects ?? []), ...(modifier.extraEffects ?? [])],
    },
  };
}

// 初始化一场战斗的统计摘要。
function createEmptyBattleSummary(): BattleSummary {
  return {
    rounds: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    remainingHp: 0,
  };
}

// 构建休息房的固定奖励，不进入战斗流程。
function buildRestReward(nodeId: string): BattleReward {
  return {
    outcome: 'victory',
    nodeId,
    kind: 'rest',
    title: '营火休整',
    description: '短暂休息后，你恢复了一部分生命值。',
    gold: 0,
    maxHpBoost: 0,
    strengthBoost: 0,
    heal: 8,
  };
}

// 根据房间类型生成敌人，并在基础模板上叠加精英或首领数值。
function buildEnemyForRoom(roomId: string, roomKind: GeneratedMap['nodes'][number]['kind']) {
  const enemy = cloneEnemy();
  enemy.id = `${roomId}-${enemy.id}`;
  enemy.name = roomKind === 'boss' ? '遗迹看守者' : roomKind === 'elite' ? '精英看守' : starterEnemy.name;
  enemy.rewardGold = roomKind === 'boss' ? 20 : roomKind === 'elite' ? 12 : starterEnemy.rewardGold;
  enemy.stats = {
    ...enemy.stats,
    hp: roomKind === 'boss' ? 34 : roomKind === 'elite' ? 28 : starterEnemy.stats.hp,
    maxHp: roomKind === 'boss' ? 34 : roomKind === 'elite' ? 28 : starterEnemy.stats.maxHp,
    strength: roomKind === 'boss' ? 8 : roomKind === 'elite' ? 6 : starterEnemy.stats.strength,
    agility: roomKind === 'elite' ? 2 : starterEnemy.stats.agility,
  };
  enemy.block = 0;
  enemy.statusEffects = [];
  return enemy;
}

// 创建整局游戏的初始状态。
function buildInitialState() {
  return {
    currentView: 'town' as ViewName,
    hero: cloneHero(),
    enemy: cloneEnemy(),
    generatedMap: generateMapSkeleton(),
    battleLog: [{ id: 'log-1', text: '新的冒险开始了。' }],
    activeRoomId: null,
    pendingReward: null,
    battleSummary: null,
    battlePriority: cloneBattlePriority(),
    unlockedBattleSkills: cloneUnlockedBattleSkills(),
    battleSkillDropChance: INITIAL_SKILL_DROP_CHANCE,
    battleCooldowns: cloneBattleCooldowns(),
    battleSkillRuntimeState: cloneBattleSkillRuntimeState(),
  };
}

export const useGameStore = create<GameState>((set) => ({
  ...buildInitialState(),
  // 仅切换当前视图，不附带其他状态变更。
  setView: (view) => set({ currentView: view }),
  // 重置整局流程，回到最初开局状态。
  resetRun: () => set(buildInitialState()),
  moveBattlePriority: (skillId, direction) =>
    set((state) => ({
      battlePriority: moveSkill(state.battlePriority, skillId, direction),
    })),
  reorderBattlePriority: (fromSkillId, toSkillId) =>
    set((state) => ({
      battlePriority: reorderSkills(state.battlePriority, fromSkillId, toSkillId),
    })),
  enableBattleSkill: (skillId) =>
    set((state) => {
      if (!state.unlockedBattleSkills.includes(skillId)) {
        return state;
      }

      return {
        battlePriority: enableSkillToPriority(state.battlePriority, skillId),
      };
    }),
  disableBattleSkill: (skillId) =>
    set((state) => {
      if (state.battlePriority.length <= 1 || !state.battlePriority.includes(skillId)) {
        return state;
      }

      return {
        battlePriority: disableSkillFromPriority(state.battlePriority, skillId),
      };
    }),
  // 为指定技能叠加局内强化，不改动基础模板定义。
  upgradeBattleSkill: (skillId, modifier) =>
    set((state) => ({
      battleSkillRuntimeState: mergeSkillModifier(state.battleSkillRuntimeState, skillId, modifier),
    })),
  // 进入房间：特殊房直接发奖励，战斗房则初始化战斗状态。
  selectRoom: (roomId) =>
    set((state) => {
      const room = state.generatedMap.nodes.find((item) => item.id === roomId);
      const selectableIds = new Set(getNextPlayableNodes(state.generatedMap).map((node) => node.id));
      if (!room || room.cleared || !selectableIds.has(roomId)) {
        return state;
      }

      if (room.kind === 'treasure' || room.kind === 'blessing' || room.kind === 'rest' || room.kind === 'event') {
        return {
          activeRoomId: room.id,
          pendingReward: room.kind === 'rest' ? buildRestReward(room.id) : buildReward(room),
          battleSummary: null,
          currentView: 'reward' as ViewName,
          battleLog: [{ id: crypto.randomUUID(), text: `${room.label} 触发了特殊效果。` }],
        };
      }

      return {
        activeRoomId: roomId,
        hero: {
          ...state.hero,
          block: 0,
          statusEffects: [],
        },
        enemy: buildEnemyForRoom(room.id, room.kind),
        battleSummary: createEmptyBattleSummary(),
        battleLog: [{ id: crypto.randomUUID(), text: `${room.label} 的敌人出现了。` }],
        currentView: 'battle' as ViewName,
        pendingReward: null,
        battleCooldowns: cloneBattleCooldowns(),
        battleSkillRuntimeState: cloneBattleSkillRuntimeState(),
      };
    }),
  // 推进一回合战斗：英雄先行动，若敌人被击杀则本轮不会反击。
  runBattleRound: () =>
    set((state) => {
      if (state.currentView !== 'battle' || !state.activeRoomId || state.pendingReward) {
        return state;
      }

      if (state.hero.stats.hp <= 0 || state.enemy.stats.hp <= 0) {
        return state;
      }

      const currentNode = state.generatedMap.nodes.find((node) => node.id === state.activeRoomId);
      if (!currentNode) {
        return state;
      }

      const usedSkillId = pickHeroSkill(state.battlePriority, state.battleCooldowns);
      const result = simulateBattleRound(state.hero, state.enemy, usedSkillId, state.battleSkillRuntimeState);
      const heroDefeated = result.heroRemainingHp <= 0;
      const enemyDefeated = result.enemyRemainingHp <= 0;
      const nextCooldowns = updateCooldowns(state.battleCooldowns, usedSkillId, state.battleSkillRuntimeState);

      const nextHero: Character = {
        ...state.hero,
        block: result.heroRemainingBlock,
        statusEffects: result.heroStatusEffects,
        stats: {
          ...state.hero.stats,
          hp: result.heroRemainingHp,
        },
      };
      const nextEnemy: Enemy = {
        ...state.enemy,
        block: result.enemyRemainingBlock,
        statusEffects: result.enemyStatusEffects,
        stats: {
          ...state.enemy.stats,
          hp: result.enemyRemainingHp,
        },
      };
      const nextLogs: BattleLogEntry[] = [
        ...state.battleLog,
        ...result.logTexts.map((text) => ({
          id: crypto.randomUUID(),
          text,
        })),
      ];
      const nextSummary: BattleSummary = {
        rounds: (state.battleSummary?.rounds ?? 0) + 1,
        totalDamageDealt: (state.battleSummary?.totalDamageDealt ?? 0) + result.heroDamage,
        totalDamageTaken: (state.battleSummary?.totalDamageTaken ?? 0) + result.enemyDamage,
        remainingHp: result.heroRemainingHp,
      };

      if (!heroDefeated && !enemyDefeated) {
        return {
          hero: nextHero,
          enemy: nextEnemy,
          battleSummary: nextSummary,
          battleLog: nextLogs,
          battleCooldowns: nextCooldowns,
        };
      }

      if (enemyDefeated) {
        const clearedBattleCount = state.generatedMap.nodes.filter((node) => node.kind === 'battle' && node.cleared).length;
        const grantedSkillChoices = rollBattleSkillDropChoices(
          currentNode,
          state.unlockedBattleSkills,
          clearedBattleCount,
          state.battleSkillDropChance,
        );
        const reward = grantedSkillChoices.length > 0
          ? buildReward(currentNode, { grantedSkillChoices })
          : buildReward(currentNode);
        const victoryLogs = [
          ...nextLogs,
          { id: crypto.randomUUID(), text: `${state.enemy.name} 被击败，获得 ${reward.gold} 金币。` },
        ];

        if (reward.choices?.some((choice) => choice.grantedSkillId)) {
          victoryLogs.push({
            id: crypto.randomUUID(),
            text: `你发现了 ${reward.choices.length} 个可带走的新技能。`,
          });
        }

        return {
          hero: {
            ...nextHero,
            block: 0,
          },
          enemy: nextEnemy,
          battleLog: victoryLogs,
          battleSummary: nextSummary,
          battleCooldowns: nextCooldowns,
          battleSkillDropChance: reward.choices?.some((choice) => choice.grantedSkillId)
            ? INITIAL_SKILL_DROP_CHANCE
            : Math.min(MAX_SKILL_DROP_CHANCE, state.battleSkillDropChance + SKILL_DROP_CHANCE_STEP),
          pendingReward: {
            ...reward,
            battleSummary: nextSummary,
          },
          currentView: 'reward' as ViewName,
        };
      }

      return {
        hero: {
          ...nextHero,
          block: 0,
        },
        enemy: nextEnemy,
        battleLog: [
          ...nextLogs,
          { id: crypto.randomUUID(), text: `${state.hero.name} 倒下了，本轮冒险结束。` },
        ],
        battleSummary: nextSummary,
        battleCooldowns: nextCooldowns,
        pendingReward: {
          outcome: 'defeat',
          nodeId: state.activeRoomId,
          kind: currentNode.kind,
          title: '冒险失败',
          description: '你在遗迹中倒下了，只能回镇上重新整顿。',
          gold: 0,
          maxHpBoost: 0,
          strengthBoost: 0,
          heal: 0,
          battleSummary: nextSummary,
        },
        currentView: 'reward' as ViewName,
      };
    }),
  // 领取奖励并回写角色与地图进度；失败则直接重开本局。
  claimReward: (choiceId) =>
    set((state) => {
      if (!state.pendingReward) {
        return state;
      }

      if (state.pendingReward.outcome === 'defeat') {
        return buildInitialState();
      }

      const selectedChoice = choiceId
        ? state.pendingReward.choices?.find((choice) => choice.id === choiceId)
        : undefined;
      const appliedReward = selectedChoice
        ? {
            ...state.pendingReward,
            gold: selectedChoice.gold,
            maxHpBoost: selectedChoice.maxHpBoost,
            strengthBoost: selectedChoice.strengthBoost,
            heal: selectedChoice.heal,
            ...(selectedChoice.grantedSkillId ? { grantedSkillId: selectedChoice.grantedSkillId } : {}),
          }
        : state.pendingReward;

      const nextMap = markNodeCleared(state.generatedMap, appliedReward.nodeId);
      const nextMaxHp = state.hero.stats.maxHp + appliedReward.maxHpBoost;
      const nextHp = Math.min(nextMaxHp, state.hero.stats.hp + appliedReward.maxHpBoost + appliedReward.heal);
      const nextHero: Character = {
        ...state.hero,
        block: 0,
        statusEffects: [],
        gold: state.hero.gold + appliedReward.gold,
        stats: {
          ...state.hero.stats,
          maxHp: nextMaxHp,
          hp: nextHp,
          strength: state.hero.stats.strength + appliedReward.strengthBoost,
        },
      };
      const nextUnlockedBattleSkills = appliedReward.grantedSkillId
        ? unlockBattleSkill(state.unlockedBattleSkills, appliedReward.grantedSkillId)
        : state.unlockedBattleSkills;
      const remainingNodes = getNextPlayableNodes(nextMap);

      return {
        hero: nextHero,
        generatedMap: nextMap,
        activeRoomId: null,
        pendingReward: null,
        battleSummary: null,
        currentView: remainingNodes.length === 0 ? 'town' : 'map',
        enemy: cloneEnemy(),
        unlockedBattleSkills: nextUnlockedBattleSkills,
        battleCooldowns: cloneBattleCooldowns(),
        battleSkillRuntimeState: cloneBattleSkillRuntimeState(),
        battleLog: [{ id: crypto.randomUUID(), text: '你整理好状态，准备继续前进。' }],
      };
    }),
}));
