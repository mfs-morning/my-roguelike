import { battleSkills } from './skills';
import type { BattleSkillDefinition, BattleSkillId, BattleSkillRuntimeState } from '../types';

// 基于静态技能模板与局内修正，计算当前这局真正生效的技能数值。
export function getEffectiveSkill(skillId: BattleSkillId, runtimeState: BattleSkillRuntimeState = {}): BattleSkillDefinition {
  const baseSkill = battleSkills[skillId];
  const modifier = runtimeState[skillId];

  return {
    ...baseSkill,
    cooldown: Math.max(0, baseSkill.cooldown + (modifier?.cooldownOffset ?? 0)),
    numbers: {
      ...baseSkill.numbers,
      damageMultiplier: (baseSkill.numbers.damageMultiplier ?? 1) + (modifier?.damageMultiplierBonus ?? 0),
      bonusDamage: (baseSkill.numbers.bonusDamage ?? 0) + (modifier?.bonusDamage ?? 0),
      blockGain: (baseSkill.numbers.blockGain ?? 0) + (modifier?.blockGainBonus ?? 0),
      extraEffects: [...(baseSkill.numbers.extraEffects ?? []), ...(modifier?.extraEffects ?? [])],
    },
  };
}

// 为界面或批量逻辑生成一份当前局内的有效技能表。
export function getEffectiveSkillMap(runtimeState: BattleSkillRuntimeState = {}): Record<BattleSkillId, BattleSkillDefinition> {
  return Object.fromEntries(
    (Object.keys(battleSkills) as BattleSkillId[]).map((skillId) => [skillId, getEffectiveSkill(skillId, runtimeState)]),
  ) as Record<BattleSkillId, BattleSkillDefinition>;
}

