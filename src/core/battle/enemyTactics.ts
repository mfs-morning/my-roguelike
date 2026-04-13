import type { EnemySkillId, EnemyTacticsProfile } from '../../types';

function createEnemyCooldownState(skillIds: EnemySkillId[]) {
  return Object.fromEntries(skillIds.map((skillId) => [skillId, 0]));
}

export const enemyTacticsProfiles: Record<'slime' | 'guard' | 'spider' | 'boss', EnemyTacticsProfile> = {
  slime: {
    label: '黏液拍击策略',
    description: '优先补盾，等你血线压低后再用爆发扑击收尾。',
    tactics: [
      { skillId: 'oozeGuard', condition: { kind: 'enemy_block_below_value', value: 4 } },
      { skillId: 'oozeBurst', condition: { kind: 'hero_hp_below_percent', value: 55 } },
      { skillId: 'oozeSlam', condition: { kind: 'always' } },
    ],
  },
  guard: {
    label: '持盾压进策略',
    description: '先顶盾稳住，再用带防守的压进动作慢慢逼近。',
    tactics: [
      { skillId: 'shieldUp', condition: { kind: 'enemy_block_below_value', value: 5 } },
      { skillId: 'shieldAdvance', condition: { kind: 'hero_block_above_value', value: 0 } },
      { skillId: 'shieldBash', condition: { kind: 'always' } },
    ],
  },
  spider: {
    label: '毒液缠斗策略',
    description: '先给你挂毒，再根据血线切换成更凶的撕咬。',
    tactics: [
      { skillId: 'poisonSpit', condition: { kind: 'hero_missing_status', statusKind: 'poison' } },
      { skillId: 'frenzyBite', condition: { kind: 'hero_hp_below_percent', value: 50 } },
      { skillId: 'bite', condition: { kind: 'always' } },
    ],
  },
  boss: {
    label: '看守者镇压策略',
    description: '会在低格挡时整备，压低你血线后再用重斩进行 dps check。',
    tactics: [
      { skillId: 'wardenFortify', condition: { kind: 'enemy_block_below_value', value: 4 } },
      { skillId: 'wardenSlash', condition: { kind: 'hero_hp_below_percent', value: 45 } },
      { skillId: 'wardenAdvance', condition: { kind: 'always' } },
    ],
  },
};

export { createEnemyCooldownState };

