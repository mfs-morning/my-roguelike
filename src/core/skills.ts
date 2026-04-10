import type { BattleSkillDefinition, BattleSkillExtraEffect, BattleSkillId, CharacterStats } from '../types';

function formatDamageFormula(multiplier = 1, bonusDamage = 0) {
  const parts = [`${Math.round(multiplier * 100)}%力量`];
  if (bonusDamage > 0) {
    parts.push(`+${bonusDamage}`);
  }
  return parts.join('');
}

function formatBlockFormula(multiplier = 1, baseBlockGain = 0) {
  const parts = [`${Math.round(multiplier * 100)}%敏捷`];
  if (baseBlockGain > 0) {
    parts.push(`+${baseBlockGain}`);
  }
  return parts.join('');
}

function formatCooldown(cooldown: number) {
  return cooldown === 0 ? '无冷却。' : `冷却 ${cooldown} 回合。`;
}

function formatExtraEffect(effect: BattleSkillExtraEffect) {
  const kindLabel = effect.kind === 'bleed' ? '流血' : '中毒';
  const targetLabel = effect.target === 'enemy' ? '敌人' : '自身';
  const durationText = effect.duration ? `（持续 ${effect.duration} 回合）` : '';
  return `使${targetLabel}附加 ${effect.value} 层${kindLabel}${durationText}`;
}

export function getSkillDescription(
  definition: Pick<BattleSkillDefinition, 'template' | 'cooldown' | 'numbers'>,
  currentStats?: Pick<CharacterStats, 'strength' | 'agility'>,
) {
  const { template, cooldown, numbers } = definition;
  const parts: string[] = [];

  if (template === 'attack') {
    const damageMultiplier = numbers.damageMultiplier ?? 1;
    const bonusDamage = numbers.bonusDamage ?? 0;

    if (currentStats) {
      const damage = Math.max(1, Math.floor(currentStats.strength * damageMultiplier) + bonusDamage);
      const formula = formatDamageFormula(damageMultiplier, bonusDamage);
      parts.push(`造成 ${damage}（${formula}）点伤害`);
    } else {
      const formula = formatDamageFormula(damageMultiplier, bonusDamage);
      parts.push(`造成（${formula}）点伤害`);
    }
  }

  if (template === 'gainBlock') {
    const baseBlockGain = numbers.blockGain ?? 0;
    const bonusDamage = numbers.bonusDamage ?? 0;
    const damageText = bonusDamage > 0 ? `造成 ${bonusDamage} 点伤害，` : '';
    const blockMultiplier = 1;

    if (currentStats) {
      const blockGain = Math.max(0, Math.floor(currentStats.agility * blockMultiplier) + baseBlockGain);
      const formula = formatBlockFormula(blockMultiplier, baseBlockGain);
      parts.push(`${damageText}获得 ${blockGain}（${formula}）点格挡`);
    } else {
      const formula = formatBlockFormula(blockMultiplier, baseBlockGain);
      parts.push(`${damageText}获得（${formula}）点格挡`);
    }
  }

  if (numbers.extraEffects?.length) {
    parts.push(numbers.extraEffects.map(formatExtraEffect).join('，'));
  }

  parts.push(formatCooldown(cooldown));
  return parts.join('，');
}

function createSkillDefinition(definition: Omit<BattleSkillDefinition, 'description'>): BattleSkillDefinition {
  return {
    ...definition,
    description: getSkillDescription(definition),
  };
}

export const battleSkills: Record<BattleSkillId, BattleSkillDefinition> = {
  attack: createSkillDefinition({
    id: 'attack',
    label: '普攻',
    classId: 'warrior',
    tags: ['warrior', 'strike'],
    cooldown: 0,
    template: 'attack',
    numbers: {
      damageMultiplier: 1,
      bonusDamage: 0,
      blockGain: 0,
    },
  }),
  attackPlus2: createSkillDefinition({
    id: 'attackPlus2',
    label: '普攻 2',
    classId: 'warrior',
    tags: ['warrior', 'strike'],
    cooldown: 0,
    template: 'attack',
    numbers: {
      damageMultiplier: 1,
      bonusDamage: 1,
      blockGain: 0,
    },
  }),
  attackPlus3: createSkillDefinition({
    id: 'attackPlus3',
    label: '普攻 3',
    classId: 'warrior',
    tags: ['warrior', 'strike'],
    cooldown: 0,
    template: 'attack',
    numbers: {
      damageMultiplier: 1,
      bonusDamage: 2,
      blockGain: 0,
    },
  }),
  attackPlus4: createSkillDefinition({
    id: 'attackPlus4',
    label: '普攻 4',
    classId: 'warrior',
    tags: ['warrior', 'strike'],
    cooldown: 0,
    template: 'attack',
    numbers: {
      damageMultiplier: 1,
      bonusDamage: 3,
      blockGain: 0,
    },
  }),
  heavyStrike: createSkillDefinition({
    id: 'heavyStrike',
    label: '重击',
    classId: 'warrior',
    tags: ['warrior', 'strike'],
    cooldown: 2,
    template: 'attack',
    numbers: {
      damageMultiplier: 1.2,
      bonusDamage: 0,
      blockGain: 0,
    },
  }),
  rend: createSkillDefinition({
    id: 'rend',
    label: '撕裂',
    classId: 'warrior',
    tags: ['warrior', 'strike', 'bleed'],
    cooldown: 2,
    template: 'attack',
    numbers: {
      damageMultiplier: 0.9,
      bonusDamage: 0,
      blockGain: 0,
      extraEffects: [{ kind: 'bleed', target: 'enemy', value: 2, duration: 3 }],
    },
  }),
  guard: createSkillDefinition({
    id: 'guard',
    label: '格挡',
    classId: 'warrior',
    tags: ['warrior', 'block'],
    cooldown: 2,
    template: 'gainBlock',
    numbers: {
      damageMultiplier: 0,
      bonusDamage: 0,
      blockGain: 5,
    },
  }),
};

export const defaultBattlePriority: BattleSkillId[] = ['heavyStrike', 'guard', 'attack'];
export const defaultUnlockedBattleSkills: BattleSkillId[] = ['attack', 'heavyStrike', 'guard'];
export const mockBattleSkillDropPool: BattleSkillId[] = ['rend', 'attackPlus2', 'attackPlus3', 'attackPlus4'];
