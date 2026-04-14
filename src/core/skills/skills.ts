// 定义静态技能数据、默认战术槽以及界面展示用的技能说明文本。
import type {
  BattleSkillDefinition,
  BattleSkillExtraEffect,
  BattleSkillId,
  BattleTacticConditionKind,
  BattleTacticSlot,
  CharacterStats,
  EnemySkillDefinition,
} from '../../types';

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

  const damageMultiplier = numbers.damageMultiplier ?? 1;
  const bonusDamage = numbers.bonusDamage ?? 0;

  if (template === 'attack' || template === 'execute' || template === 'statusBurst') {
    if (currentStats) {
      const damage = Math.max(1, Math.floor(currentStats.strength * damageMultiplier) + bonusDamage);
      const formula = formatDamageFormula(damageMultiplier, bonusDamage);
      parts.push(`造成 ${damage}（${formula}）点伤害`);
    } else {
      const formula = formatDamageFormula(damageMultiplier, bonusDamage);
      parts.push(`造成（${formula}）点伤害`);
    }
  }

  if (template === 'aoe') {
    if (currentStats) {
      const damage = Math.max(1, Math.floor(currentStats.strength * damageMultiplier) + bonusDamage);
      parts.push(`对所有敌人造成 ${damage} 点相同伤害`);
    } else {
      parts.push('对所有敌人造成相同伤害');
    }
  }

  if (template === 'splashStrike') {
    const primaryDamageMultiplier = numbers.primaryDamageMultiplier ?? damageMultiplier;
    const primaryBonusDamage = numbers.primaryBonusDamage ?? bonusDamage;
    const splashDamageMultiplier = numbers.splashDamageMultiplier ?? 0.35;
    const splashBonusDamage = numbers.splashBonusDamage ?? 0;

    if (currentStats) {
      const mainDamage = Math.max(1, Math.floor(currentStats.strength * primaryDamageMultiplier) + primaryBonusDamage);
      const splashDamage = Math.max(0, Math.floor(currentStats.strength * splashDamageMultiplier) + splashBonusDamage);
      parts.push(`主目标造成 ${mainDamage} 点伤害，并对后排造成 ${splashDamage} 点溅射伤害`);
    } else {
      parts.push('对主目标造成伤害，并将部分伤害传到后排');
    }
  }

  if (template === 'gainBlock' || template === 'gainBlockAttack') {
    const baseBlockGain = numbers.blockGain ?? 0;
    const attackText = template === 'gainBlockAttack'
      ? currentStats
        ? `造成 ${Math.max(1, Math.floor(currentStats.strength * damageMultiplier) + bonusDamage)} 点伤害，`
        : '造成伤害，'
      : bonusDamage > 0
        ? `造成 ${bonusDamage} 点伤害，`
        : '';
    const blockMultiplier = template === 'gainBlockAttack' ? 0.6 : 1;

    if (currentStats) {
      const blockGain = Math.max(0, Math.floor(currentStats.agility * blockMultiplier) + baseBlockGain);
      const formula = formatBlockFormula(blockMultiplier, baseBlockGain);
      parts.push(`${attackText}获得 ${blockGain}（${formula}）点格挡`);
    } else {
      const formula = formatBlockFormula(blockMultiplier, baseBlockGain);
      parts.push(`${attackText}获得（${formula}）点格挡`);
    }
  }

  if (template === 'execute') {
    parts.push(`若目标生命低于 ${numbers.executeThresholdPercent ?? 35}% ，则改为高额处决伤害`);
  }

  if (template === 'statusBurst') {
    parts.push(`每层异常状态额外追加 ${numbers.statusBurstPerStack ?? 1} 点伤害`);
  }

  if (numbers.extraEffects?.length) {
    parts.push(numbers.extraEffects.map(formatExtraEffect).join('，'));
  }

  parts.push(formatCooldown(cooldown));
  return parts.join('，');
}

export function getEnemySkillDescription(
  definition: Pick<EnemySkillDefinition, 'template' | 'cooldown' | 'numbers'>,
  currentStats?: Pick<CharacterStats, 'strength' | 'agility'>,
) {
  return getSkillDescription(definition, currentStats);
}

function createSkillDefinition(definition: Omit<BattleSkillDefinition, 'description'>): BattleSkillDefinition {
  return {
    ...definition,
    description: getSkillDescription(definition),
  };
}

const defaultTacticConditions: BattleTacticConditionKind[] = ['always', 'enemy_hp_below_percent', 'hero_hp_below_percent'];

export const battleSkills: Record<BattleSkillId, BattleSkillDefinition> = {
  attack: createSkillDefinition({
    id: 'attack',
    label: '普攻',
    classId: 'warrior',
    tags: ['warrior', 'strike'],
    availableConditions: ['always'],
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
    availableConditions: ['always'],
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
    availableConditions: ['always'],
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
    availableConditions: ['always'],
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
    availableConditions: defaultTacticConditions,
    cooldown: 1,
    template: 'attack',
    numbers: {
      damageMultiplier: 1.35,
      bonusDamage: 1,
      blockGain: 0,
    },
  }),
  rend: createSkillDefinition({
    id: 'rend',
    label: '撕裂',
    classId: 'warrior',
    tags: ['warrior', 'strike', 'bleed'],
    availableConditions: ['always', 'enemy_hp_below_percent'],
    cooldown: 1,
    template: 'attack',
    numbers: {
      damageMultiplier: 1,
      bonusDamage: 1,
      blockGain: 0,
      extraEffects: [{ kind: 'bleed', target: 'enemy', value: 3, duration: 3 }],
    },
  }),
  guard: createSkillDefinition({
    id: 'guard',
    label: '格挡',
    classId: 'warrior',
    tags: ['warrior', 'block'],
    availableConditions: ['always', 'hero_hp_below_percent'],
    cooldown: 1,
    template: 'gainBlock',
    numbers: {
      damageMultiplier: 0,
      bonusDamage: 0,
      blockGain: 8,
    },
  }),
};

export const defaultBattleTactics: BattleTacticSlot[] = [
  { skillId: 'heavyStrike', condition: { kind: 'always' } },
  { skillId: 'guard', condition: { kind: 'always' } },
  { skillId: 'attack', condition: { kind: 'always' } },
];
export const defaultUnlockedBattleSkills: BattleSkillId[] = ['attack', 'heavyStrike', 'guard'];
export const mockBattleSkillDropPool: BattleSkillId[] = ['rend', 'attackPlus2', 'attackPlus3', 'attackPlus4'];
