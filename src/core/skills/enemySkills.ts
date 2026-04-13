import type { EnemySkillDefinition, EnemySkillId } from '../../types';
import { getEnemySkillDescription } from './skills';

function createEnemySkillDefinition(definition: Omit<EnemySkillDefinition, 'description'>): EnemySkillDefinition {
  return {
    ...definition,
    description: getEnemySkillDescription(definition),
  };
}

export const enemySkills: Record<EnemySkillId, EnemySkillDefinition> = {
  oozeSlam: createEnemySkillDefinition({
    id: 'oozeSlam',
    label: '拍击',
    cooldown: 0,
    template: 'attack',
    numbers: { damageMultiplier: 1, bonusDamage: 0, blockGain: 0 },
  }),
  oozeBurst: createEnemySkillDefinition({
    id: 'oozeBurst',
    label: '弹跳扑击',
    cooldown: 1,
    template: 'attack',
    numbers: { damageMultiplier: 1.25, bonusDamage: 0, blockGain: 0 },
  }),
  oozeGuard: createEnemySkillDefinition({
    id: 'oozeGuard',
    label: '收缩',
    cooldown: 2,
    template: 'gainBlock',
    numbers: { blockGain: 5, bonusDamage: 0 },
  }),
  shieldUp: createEnemySkillDefinition({
    id: 'shieldUp',
    label: '举盾',
    cooldown: 1,
    template: 'gainBlock',
    numbers: { blockGain: 6, bonusDamage: 0 },
  }),
  shieldBash: createEnemySkillDefinition({
    id: 'shieldBash',
    label: '盾击',
    cooldown: 0,
    template: 'attack',
    numbers: { damageMultiplier: 0.9, bonusDamage: 2, blockGain: 0 },
  }),
  shieldAdvance: createEnemySkillDefinition({
    id: 'shieldAdvance',
    label: '压进',
    cooldown: 2,
    template: 'gainBlock',
    numbers: { blockGain: 4, bonusDamage: 4 },
  }),
  poisonSpit: createEnemySkillDefinition({
    id: 'poisonSpit',
    label: '喷吐毒液',
    cooldown: 2,
    template: 'attack',
    numbers: {
      damageMultiplier: 0.65,
      bonusDamage: 0,
      blockGain: 0,
      extraEffects: [{ kind: 'poison', target: 'hero', value: 2, duration: 3 }],
    },
  }),
  bite: createEnemySkillDefinition({
    id: 'bite',
    label: '啃咬',
    cooldown: 0,
    template: 'attack',
    numbers: { damageMultiplier: 1, bonusDamage: 1, blockGain: 0 },
  }),
  frenzyBite: createEnemySkillDefinition({
    id: 'frenzyBite',
    label: '连咬',
    cooldown: 1,
    template: 'attack',
    numbers: { damageMultiplier: 1.15, bonusDamage: 2, blockGain: 0 },
  }),
  wardenSlash: createEnemySkillDefinition({
    id: 'wardenSlash',
    label: '重斩',
    cooldown: 0,
    template: 'attack',
    numbers: { damageMultiplier: 1.1, bonusDamage: 3, blockGain: 0 },
  }),
  wardenAdvance: createEnemySkillDefinition({
    id: 'wardenAdvance',
    label: '镇压',
    cooldown: 2,
    template: 'gainBlock',
    numbers: { blockGain: 5, bonusDamage: 6 },
  }),
  wardenFortify: createEnemySkillDefinition({
    id: 'wardenFortify',
    label: '整备',
    cooldown: 2,
    template: 'gainBlock',
    numbers: { blockGain: 8, bonusDamage: 0 },
  }),
};

