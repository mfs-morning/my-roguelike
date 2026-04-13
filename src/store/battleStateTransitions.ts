// 管理进入战斗与推进战斗回合时的状态迁移逻辑。
import { createEnemyCooldownState, enemyTacticsProfiles } from '../core/battle/enemyTactics';
import { starterEnemy } from '../core/config/constants';
import { simulateBattleRound } from '../core/battle/engine';
import {
  INITIAL_SKILL_DROP_CHANCE,
  MAX_SKILL_DROP_CHANCE,
  SKILL_DROP_CHANCE_STEP,
  buildReward,
  rollBattleSkillDropChoices,
} from '../core/progression/reward';
import type {
  BattleLogEntry,
  BattleReward,
  BattleSummary,
  Character,
  Enemy,
  GeneratedMap,
  ViewName,
} from '../types';
import type { BattleEntryPatch, BattleRoundPatch, BattleRoundState, SelectRoomState } from './types';
import { cloneBattleCooldowns, cloneBattleSkillRuntimeState, cloneEnemy, createEmptyBattleSummary } from './gameStateFactory';
import { pickHeroSkill, updateCooldowns } from '../core/battle/battlePriority';

// 构建休息房的固定奖励，不进入战斗流程。
export function buildRestReward(nodeId: string): BattleReward {
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
export function buildEnemyForRoom(roomId: string, roomKind: GeneratedMap['nodes'][number]['kind']) {
  const enemy = cloneEnemy();
  const profile = roomKind === 'boss'
    ? enemyTacticsProfiles.boss
    : roomKind === 'elite'
      ? enemyTacticsProfiles.guard
      : Math.random() < 0.5
        ? enemyTacticsProfiles.slime
        : enemyTacticsProfiles.spider;

  enemy.id = `${roomId}-${enemy.id}`;
  enemy.name = roomKind === 'boss'
    ? '遗迹看守者'
    : profile === enemyTacticsProfiles.spider
      ? '毒蛛'
      : profile === enemyTacticsProfiles.guard
        ? '持盾守卫'
        : starterEnemy.name;
  enemy.rewardGold = roomKind === 'boss' ? 20 : roomKind === 'elite' ? 12 : starterEnemy.rewardGold;
  enemy.tacticsProfile = structuredClone(profile);
  enemy.enemyCooldowns = createEnemyCooldownState(profile.tactics.map((slot) => slot.skillId));
  enemy.enemySkillRuntimeState = roomKind === 'boss'
    ? { wardenSlash: { bonusDamage: 2 }, wardenAdvance: { blockGainBonus: 2 } }
    : roomKind === 'elite'
      ? { shieldAdvance: { bonusDamage: 1 } }
      : {};
  enemy.stats = {
    ...enemy.stats,
    hp: roomKind === 'boss' ? 34 : roomKind === 'elite' ? 28 : profile === enemyTacticsProfiles.spider ? 16 : starterEnemy.stats.hp,
    maxHp: roomKind === 'boss' ? 34 : roomKind === 'elite' ? 28 : profile === enemyTacticsProfiles.spider ? 16 : starterEnemy.stats.maxHp,
    strength: roomKind === 'boss' ? 8 : roomKind === 'elite' ? 6 : profile === enemyTacticsProfiles.guard ? 5 : profile === enemyTacticsProfiles.spider ? 4 : starterEnemy.stats.strength,
    agility: roomKind === 'elite' ? 2 : profile === enemyTacticsProfiles.spider ? 1 : starterEnemy.stats.agility,
  };
  enemy.block = 0;
  enemy.statusEffects = [];
  return enemy;
}

export function createBattleEntryState(state: SelectRoomState, roomId: string, room: GeneratedMap['nodes'][number]): BattleEntryPatch {
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
}

export function resolveBattleRoundState(state: BattleRoundState): BattleRoundPatch | null {
  if (state.currentView !== 'battle' || !state.activeRoomId || state.pendingReward) {
    return null;
  }

  if (state.hero.stats.hp <= 0 || state.enemy.stats.hp <= 0) {
    return null;
  }

  const currentNode = state.generatedMap.nodes.find((node) => node.id === state.activeRoomId);
  if (!currentNode) {
    return null;
  }

  const usedSkillId = pickHeroSkill(state.battleTactics, state.battleCooldowns, state.hero, state.enemy);
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
    enemyCooldowns: result.nextEnemyCooldowns,
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
    const reward = grantedSkillChoices.length > 0 ? buildReward(currentNode, { grantedSkillChoices }) : buildReward(currentNode);
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
}
