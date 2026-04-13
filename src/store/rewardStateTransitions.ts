// 处理奖励领取、地图推进、技能解锁与战后状态重置。
import { getNextPlayableNodes, markNodeCleared } from '../core/map/mapProgress';
import { INITIAL_SKILL_DROP_CHANCE } from '../core/progression/reward';
import type { BattleReward, Character, GeneratedMap } from '../types';
import type { ClaimRewardState, RewardClaimPatch } from './types';
import { enableSkillToPriority, unlockBattleSkill } from './battleTacticsState';
import { buildInitialState, cloneBattleCooldowns, cloneBattleSkillRuntimeState, cloneEnemy } from './gameStateFactory';

export function resolveRewardClaimState(state: ClaimRewardState, choiceId?: string): RewardClaimPatch | ReturnType<typeof buildInitialState> | null {
  if (!state.pendingReward) {
    return null;
  }

  if (state.pendingReward.outcome === 'defeat') {
    return buildInitialState(INITIAL_SKILL_DROP_CHANCE);
  }

  const selectedChoice = choiceId ? state.pendingReward.choices?.find((choice) => choice.id === choiceId) : undefined;
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
    battleTactics: appliedReward.grantedSkillId
      ? enableSkillToPriority(state.battleTactics, appliedReward.grantedSkillId)
      : state.battleTactics,
    unlockedBattleSkills: nextUnlockedBattleSkills,
    battleCooldowns: cloneBattleCooldowns(),
    battleSkillRuntimeState: cloneBattleSkillRuntimeState(),
    battleLog: [{ id: crypto.randomUUID(), text: '你整理好状态，准备继续前进。' }],
  };
}

