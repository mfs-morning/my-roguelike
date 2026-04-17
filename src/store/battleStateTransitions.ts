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
export function buildEnemyForRoom(
  roomId: string,
  roomKind: GeneratedMap['nodes'][number]['kind'],
  position: 'front' | 'back' = 'front',
) {
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
      ? position === 'back' ? '后排毒蛛' : '毒蛛'
      : profile === enemyTacticsProfiles.guard
        ? position === 'back' ? '后排守卫' : '持盾守卫'
        : position === 'back' ? '后排史莱姆' : starterEnemy.name;
  enemy.rewardGold = roomKind === 'boss' ? 24 : roomKind === 'elite' ? 14 : 6;
  enemy.tacticsProfile = structuredClone(profile);
  enemy.enemyCooldowns = createEnemyCooldownState(profile.tactics.map((slot) => slot.skillId));
  enemy.enemySkillRuntimeState = roomKind === 'boss'
    ? { wardenSlash: { bonusDamage: 1 }, wardenAdvance: { blockGainBonus: 1 } }
    : roomKind === 'elite'
      ? { shieldAdvance: { bonusDamage: 0 } }
      : {};
  enemy.stats = {
    ...enemy.stats,
    hp: roomKind === 'boss' ? 56 : roomKind === 'elite' ? 42 : profile === enemyTacticsProfiles.spider ? 26 : 100,
    maxHp: roomKind === 'boss' ? 56 : roomKind === 'elite' ? 42 : profile === enemyTacticsProfiles.spider ? 26 : 100,
    strength: roomKind === 'boss' ? 6 : roomKind === 'elite' ? 5 : profile === enemyTacticsProfiles.guard ? 4 : profile === enemyTacticsProfiles.spider ? 3 : 3,
    agility: roomKind === 'elite' ? 1 : profile === enemyTacticsProfiles.spider ? 1 : 0,
  };
  if (position === 'back') {
    enemy.stats = {
      ...enemy.stats,
      hp: Math.max(18, enemy.stats.hp - 4),
      maxHp: Math.max(18, enemy.stats.maxHp - 4),
      strength: Math.max(3, enemy.stats.strength - 1),
    };
  }
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
    enemy: buildEnemyForRoom(room.id, room.kind, 'front'),
    backEnemy: room.kind === 'boss' || room.kind === 'elite' ? buildEnemyForRoom(`${room.id}-back`, 'battle', 'back') : null,
    battleSummary: createEmptyBattleSummary(),
    battleLog: [{ id: crypto.randomUUID(), kind: 'system', text: `${room.label} 的敌人出现了。` }],
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

  const targetEnemy = state.enemy.stats.hp > 0 ? state.enemy : state.backEnemy ?? state.enemy;
  const usedSkillId = pickHeroSkill(state.battleTactics, state.battleCooldowns, state.hero, targetEnemy);
  const result = simulateBattleRound(state.hero, state.enemy, state.backEnemy, usedSkillId, state.battleSkillRuntimeState);
  const heroDefeated = result.heroRemainingHp <= 0;
  const enemyDefeated = !result.nextEnemy && !result.nextBackEnemy;
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
  const roundNumber = (state.battleSummary?.rounds ?? 0) + 1;
  const nextLogs: BattleLogEntry[] = [
    ...state.battleLog,
    { id: crypto.randomUUID(), kind: 'round', round: roundNumber, text: `第 ${roundNumber} 回合` },
    ...result.logEntries.map((entry) => ({
      id: crypto.randomUUID(),
      round: roundNumber,
      ...entry,
    })),
  ];
  const nextSummary: BattleSummary = {
    rounds: roundNumber,
    totalDamageDealt: (state.battleSummary?.totalDamageDealt ?? 0) + result.heroDamage,
    totalDamageTaken: (state.battleSummary?.totalDamageTaken ?? 0) + result.enemyDamage,
    remainingHp: result.heroRemainingHp,
  };

  if (!heroDefeated && !enemyDefeated) {
    return {
      hero: nextHero,
      enemy: result.nextEnemy ?? state.enemy,
      backEnemy: result.nextBackEnemy,
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
      { id: crypto.randomUUID(), kind: 'result', text: `遭遇敌群已被击败，获得 ${reward.gold} 金币。` },
    ];

    if (reward.choices?.some((choice) => choice.grantedSkillId)) {
      victoryLogs.push({
        id: crypto.randomUUID(),
        kind: 'result',
        text: `你发现了 ${reward.choices.length} 个可带走的新技能。`,
      });
    }

    return {
      hero: {
        ...nextHero,
        block: 0,
      },
      enemy: result.nextEnemy ?? state.enemy,
      backEnemy: result.nextBackEnemy,
      battleLog: victoryLogs as BattleLogEntry[],
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
    enemy: result.nextEnemy ?? state.enemy,
    backEnemy: result.nextBackEnemy,
    battleLog: [
      ...nextLogs,
      { id: crypto.randomUUID(), kind: 'result', text: `${state.hero.name} 倒下了，本轮冒险结束。` },
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
