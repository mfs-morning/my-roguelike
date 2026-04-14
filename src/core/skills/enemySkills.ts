import type { EnemySkillDefinition, EnemySkillId } from '../../types';
import { getEnemySkillDescription } from './skills';

function createEnemySkillDefinition(
  definition: Omit<EnemySkillDefinition, 'effectDescription'>,
): EnemySkillDefinition {
  return {
    ...definition,
    effectDescription: getEnemySkillDescription(definition),
  };
}

export const enemySkills: Record<EnemySkillId, EnemySkillDefinition> = {
  oozeSlam: createEnemySkillDefinition({
    id: 'oozeSlam',
    label: '拍击',
    description: '软泥怪以全身重量发动一次拍击。',
    cooldown: 0,
    template: 'attack',
    numbers: { damageMultiplier: 1, bonusDamage: 0, blockGain: 0 },
  }),
  oozeBurst: createEnemySkillDefinition({
    id: 'oozeBurst',
    label: '弹跳扑击',
    description: '软泥怪跃起后重重压向目标。',
    cooldown: 1,
    template: 'attack',
    numbers: { damageMultiplier: 1.25, bonusDamage: 0, blockGain: 0 },
  }),
  oozeGuard: createEnemySkillDefinition({
    id: 'oozeGuard',
    label: '收缩',
    description: '软泥怪收束身形，以减轻即将到来的伤害。',
    cooldown: 2,
    template: 'gainBlock',
    numbers: { blockGain: 5, bonusDamage: 0 },
  }),
  shieldUp: createEnemySkillDefinition({
    id: 'shieldUp',
    label: '举盾',
    description: '该生物抬起盾牌，进入防守姿态。',
    cooldown: 1,
    template: 'gainBlock',
    numbers: { blockGain: 6, bonusDamage: 0 },
  }),
  shieldBash: createEnemySkillDefinition({
    id: 'shieldBash',
    label: '盾击',
    description: '该生物以盾牌边缘猛击目标。',
    cooldown: 0,
    template: 'attack',
    numbers: { damageMultiplier: 0.9, bonusDamage: 2, blockGain: 0 },
  }),
  shieldAdvance: createEnemySkillDefinition({
    id: 'shieldAdvance',
    label: '压进',
    description: '该生物顶盾前压，并借势发动打击。',
    cooldown: 2,
    template: 'gainBlock',
    numbers: { blockGain: 4, bonusDamage: 4 },
  }),
  poisonSpit: createEnemySkillDefinition({
    id: 'poisonSpit',
    label: '喷吐毒液',
    description: '该生物向目标喷吐腐毒液体。',
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
    description: '该生物扑向目标并进行撕咬。',
    cooldown: 0,
    template: 'attack',
    numbers: { damageMultiplier: 1, bonusDamage: 1, blockGain: 0 },
  }),
  frenzyBite: createEnemySkillDefinition({
    id: 'frenzyBite',
    label: '连咬',
    description: '该生物以狂乱姿态连续撕咬目标。',
    cooldown: 1,
    template: 'attack',
    numbers: { damageMultiplier: 1.15, bonusDamage: 2, blockGain: 0 },
  }),
  wardenSlash: createEnemySkillDefinition({
    id: 'wardenSlash',
    label: '重斩',
    description: '守卫以重兵刃施展一次沉重斩击。',
    cooldown: 0,
    template: 'attack',
    numbers: { damageMultiplier: 1.1, bonusDamage: 3, blockGain: 0 },
  }),
  wardenAdvance: createEnemySkillDefinition({
    id: 'wardenAdvance',
    label: '镇压',
    description: '守卫稳步推进，在防守中施加压迫。',
    cooldown: 2,
    template: 'gainBlock',
    numbers: { blockGain: 5, bonusDamage: 6 },
  }),
  wardenFortify: createEnemySkillDefinition({
    id: 'wardenFortify',
    label: '整备',
    description: '守卫调整姿态，重新整备防线。',
    cooldown: 2,
    template: 'gainBlock',
    numbers: { blockGain: 8, bonusDamage: 0 },
  }),
};
