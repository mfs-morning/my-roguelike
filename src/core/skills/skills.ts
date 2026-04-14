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
const offenseTacticConditions: BattleTacticConditionKind[] = ['always', 'enemy_hp_below_percent'];
const defenseTacticConditions: BattleTacticConditionKind[] = ['always', 'hero_hp_below_percent'];

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
  guard: createSkillDefinition({
    id: 'guard',
    label: '格挡',
    classId: 'warrior',
    tags: ['warrior', 'block'],
    availableConditions: defenseTacticConditions,
    cooldown: 1,
    template: 'gainBlock',
    numbers: {
      damageMultiplier: 0,
      bonusDamage: 0,
      blockGain: 8,
    },
  }),
  rend: createSkillDefinition({
    id: 'rend',
    label: '撕裂',
    classId: 'warrior',
    tags: ['warrior', 'strike', 'bleed'],
    availableConditions: offenseTacticConditions,
    cooldown: 1,
    template: 'attack',
    numbers: {
      damageMultiplier: 1,
      bonusDamage: 1,
      blockGain: 0,
      extraEffects: [{ kind: 'bleed', target: 'enemy', value: 3, duration: 3 }],
    },
  }),
  sweepingSlash: createSkillDefinition({
    id: 'sweepingSlash',
    label: '横扫',
    classId: 'warrior',
    tags: ['warrior', 'strike'],
    availableConditions: defaultTacticConditions,
    cooldown: 1,
    template: 'aoe',
    numbers: {
      damageMultiplier: 0.85,
      bonusDamage: 1,
      blockGain: 0,
    },
  }),
  quakeSmash: createSkillDefinition({
    id: 'quakeSmash',
    label: '震地猛砸',
    classId: 'warrior',
    tags: ['warrior', 'strike'],
    availableConditions: offenseTacticConditions,
    cooldown: 2,
    template: 'aoe',
    numbers: {
      damageMultiplier: 1.05,
      bonusDamage: 1,
      blockGain: 0,
    },
  }),
  piercingThrust: createSkillDefinition({
    id: 'piercingThrust',
    label: '穿阵突刺',
    classId: 'warrior',
    tags: ['warrior', 'strike'],
    availableConditions: defaultTacticConditions,
    cooldown: 1,
    template: 'splashStrike',
    numbers: {
      damageMultiplier: 1.15,
      bonusDamage: 1,
      primaryDamageMultiplier: 1.15,
      primaryBonusDamage: 1,
      splashDamageMultiplier: 0.65,
      splashBonusDamage: 0,
      blockGain: 0,
    },
  }),
  meteorHammer: createSkillDefinition({
    id: 'meteorHammer',
    label: '流星锤',
    classId: 'warrior',
    tags: ['warrior', 'strike'],
    availableConditions: offenseTacticConditions,
    cooldown: 2,
    template: 'splashStrike',
    numbers: {
      damageMultiplier: 1.35,
      bonusDamage: 2,
      primaryDamageMultiplier: 1.35,
      primaryBonusDamage: 2,
      splashDamageMultiplier: 0.7,
      splashBonusDamage: 1,
      blockGain: 0,
    },
  }),
  executioner: createSkillDefinition({
    id: 'executioner',
    label: '断头斩',
    classId: 'warrior',
    tags: ['warrior', 'strike'],
    availableConditions: ['always', 'enemy_hp_below_percent'],
    cooldown: 2,
    template: 'execute',
    numbers: {
      damageMultiplier: 0.95,
      bonusDamage: 1,
      executeThresholdPercent: 40,
      executeDamageMultiplier: 2.35,
      blockGain: 0,
    },
  }),
  bloodburst: createSkillDefinition({
    id: 'bloodburst',
    label: '裂伤引爆',
    classId: 'warrior',
    tags: ['warrior', 'strike', 'bleed', 'poison'],
    availableConditions: ['always', 'enemy_hp_below_percent'],
    cooldown: 1,
    template: 'statusBurst',
    numbers: {
      damageMultiplier: 0.75,
      bonusDamage: 0,
      statusBurstPerStack: 2,
      blockGain: 0,
    },
  }),
  ironAssault: createSkillDefinition({
    id: 'ironAssault',
    label: '铁壁强袭',
    classId: 'warrior',
    tags: ['warrior', 'strike', 'block'],
    availableConditions: defaultTacticConditions,
    cooldown: 1,
    template: 'gainBlockAttack',
    numbers: {
      damageMultiplier: 0.9,
      bonusDamage: 1,
      blockGain: 5,
    },
  }),
  holdTheLine: createSkillDefinition({
    id: 'holdTheLine',
    label: '稳守反击',
    classId: 'warrior',
    tags: ['warrior', 'strike', 'block'],
    availableConditions: defenseTacticConditions,
    cooldown: 2,
    template: 'gainBlockAttack',
    numbers: {
      damageMultiplier: 0.6,
      bonusDamage: 0,
      blockGain: 10,
    },
  }),
  venomEdge: createSkillDefinition({
    id: 'venomEdge',
    label: '淬毒刃',
    classId: 'warrior',
    tags: ['warrior', 'strike', 'poison'],
    availableConditions: offenseTacticConditions,
    cooldown: 1,
    template: 'attack',
    numbers: {
      damageMultiplier: 0.95,
      bonusDamage: 1,
      blockGain: 0,
      extraEffects: [{ kind: 'poison', target: 'enemy', value: 3, duration: 3 }],
    },
  }),
  crimsonHarvest: createSkillDefinition({
    id: 'crimsonHarvest',
    label: '猩红收割',
    classId: 'warrior',
    tags: ['warrior', 'strike', 'bleed', 'poison'],
    availableConditions: ['always', 'enemy_hp_below_percent'],
    cooldown: 2,
    template: 'statusBurst',
    numbers: {
      damageMultiplier: 0.9,
      bonusDamage: 1,
      statusBurstPerStack: 3,
      blockGain: 0,
      extraEffects: [{ kind: 'bleed', target: 'enemy', value: 2, duration: 2 }],
    },
  }),
  whirlwind: createSkillDefinition({
    id: 'whirlwind',
    label: '回旋斩',
    classId: 'warrior',
    tags: ['warrior', 'strike', 'bleed'],
    availableConditions: defaultTacticConditions,
    cooldown: 2,
    template: 'aoe',
    numbers: {
      damageMultiplier: 0.9,
      bonusDamage: 1,
      blockGain: 0,
      extraEffects: [{ kind: 'bleed', target: 'enemy', value: 1, duration: 2 }],
    },
  }),
  shockwave: createSkillDefinition({
    id: 'shockwave',
    label: '冲击波',
    classId: 'warrior',
    tags: ['warrior', 'strike', 'block'],
    availableConditions: defaultTacticConditions,
    cooldown: 2,
    template: 'aoe',
    numbers: {
      damageMultiplier: 0.8,
      bonusDamage: 0,
      blockGain: 6,
    },
  }),
  backlineCrusher: createSkillDefinition({
    id: 'backlineCrusher',
    label: '破阵重压',
    classId: 'warrior',
    tags: ['warrior', 'strike'],
    availableConditions: offenseTacticConditions,
    cooldown: 2,
    template: 'splashStrike',
    numbers: {
      damageMultiplier: 1.2,
      bonusDamage: 1,
      primaryDamageMultiplier: 1.2,
      primaryBonusDamage: 1,
      splashDamageMultiplier: 0.95,
      splashBonusDamage: 1,
      blockGain: 0,
    },
  }),
  reaperRush: createSkillDefinition({
    id: 'reaperRush',
    label: '死线突进',
    classId: 'warrior',
    tags: ['warrior', 'strike'],
    availableConditions: ['always', 'enemy_hp_below_percent'],
    cooldown: 1,
    template: 'execute',
    numbers: {
      damageMultiplier: 1,
      bonusDamage: 1,
      executeThresholdPercent: 50,
      executeDamageMultiplier: 2,
      blockGain: 0,
    },
  }),
  toxicDetonation: createSkillDefinition({
    id: 'toxicDetonation',
    label: '毒爆',
    classId: 'warrior',
    tags: ['warrior', 'strike', 'poison'],
    availableConditions: ['always', 'enemy_hp_below_percent'],
    cooldown: 2,
    template: 'statusBurst',
    numbers: {
      damageMultiplier: 0.7,
      bonusDamage: 0,
      statusBurstPerStack: 4,
      blockGain: 0,
      extraEffects: [{ kind: 'poison', target: 'enemy', value: 2, duration: 2 }],
    },
  }),
  shieldRam: createSkillDefinition({
    id: 'shieldRam',
    label: '盾撞',
    classId: 'warrior',
    tags: ['warrior', 'strike', 'block'],
    availableConditions: defenseTacticConditions,
    cooldown: 1,
    template: 'gainBlockAttack',
    numbers: {
      damageMultiplier: 0.8,
      bonusDamage: 1,
      blockGain: 7,
    },
  }),
};

export const defaultBattleTactics: BattleTacticSlot[] = [
  { skillId: 'heavyStrike', condition: { kind: 'always' } },
  { skillId: 'guard', condition: { kind: 'hero_hp_below_percent', value: 55 } },
  { skillId: 'attack', condition: { kind: 'always' } },
];

export const defaultUnlockedBattleSkills: BattleSkillId[] = ['attack', 'heavyStrike', 'guard', 'rend'];

export const mockBattleSkillDropPool: BattleSkillId[] = [
  'sweepingSlash',
  'quakeSmash',
  'piercingThrust',
  'meteorHammer',
  'executioner',
  'bloodburst',
  'ironAssault',
  'holdTheLine',
  'venomEdge',
  'crimsonHarvest',
  'whirlwind',
  'shockwave',
  'backlineCrusher',
  'reaperRush',
  'toxicDetonation',
  'shieldRam',
];
