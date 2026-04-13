// 维护战术槽、技能启停、条件归一化与局内技能修正的纯函数。
import { battleSkills } from '../core/skills/skills';
import type {
  BattleSkillId,
  BattleSkillModifier,
  BattleSkillRuntimeState,
  BattleTacticCondition,
  BattleTacticSlot,
} from '../types';

// 从战术槽中移除指定技能，但不负责最少保留数量校验。
export function disableSkillFromPriority(tactics: BattleTacticSlot[], skillId: BattleSkillId) {
  return tactics.filter((slot) => slot.skillId !== skillId);
}

export function normalizeTacticCondition(skillId: BattleSkillId, condition: BattleTacticCondition): BattleTacticCondition {
  const availableConditions = battleSkills[skillId].availableConditions;
  return availableConditions.includes(condition.kind) ? condition : { kind: 'always' };
}

// 将新技能加入战术槽末尾，已存在则保持不变。
export function enableSkillToPriority(tactics: BattleTacticSlot[], skillId: BattleSkillId): BattleTacticSlot[] {
  if (tactics.some((slot) => slot.skillId === skillId)) {
    return tactics;
  }

  return [...tactics, { skillId, condition: normalizeTacticCondition(skillId, { kind: 'always' }) }];
}

export function updateTacticCondition(
  tactics: BattleTacticSlot[],
  skillId: BattleSkillId,
  condition: BattleTacticCondition,
) {
  const nextCondition = normalizeTacticCondition(skillId, condition);
  return tactics.map((slot) => (slot.skillId === skillId ? { ...slot, condition: nextCondition } : slot));
}

// 将新技能加入解锁池，保持唯一性。
export function unlockBattleSkill(unlockedSkills: BattleSkillId[], skillId: BattleSkillId) {
  if (unlockedSkills.includes(skillId)) {
    return unlockedSkills;
  }

  return [...unlockedSkills, skillId];
}

// 将技能强化合并到当前局内状态，适合奖励、事件或遗物带来的即时升级。
export function mergeSkillModifier(
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

