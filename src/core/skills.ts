import type { BattleSkillDefinition, BattleSkillId } from '../types';

export const battleSkills: Record<BattleSkillId, BattleSkillDefinition> = {
  attack: {
    id: 'attack',
    label: '普攻',
    description: '稳定出手，没有冷却。',
    classId: 'warrior',
    tags: ['warrior', 'strike'],
    cooldown: 0,
    template: 'attack',
    numbers: {
      damageMultiplier: 1,
      bonusDamage: 0,
      blockGain: 0,
    },
  },
  attackPlus2: {
    id: 'attackPlus2',
    label: '普攻 2',
    description: '比普攻更凶狠的一击，没有冷却。',
    classId: 'warrior',
    tags: ['warrior', 'strike'],
    cooldown: 0,
    template: 'attack',
    numbers: {
      damageMultiplier: 1,
      bonusDamage: 1,
      blockGain: 0,
    },
  },
  attackPlus3: {
    id: 'attackPlus3',
    label: '普攻 3',
    description: '更成熟的基础剑技，没有冷却。',
    classId: 'warrior',
    tags: ['warrior', 'strike'],
    cooldown: 0,
    template: 'attack',
    numbers: {
      damageMultiplier: 1,
      bonusDamage: 2,
      blockGain: 0,
    },
  },
  attackPlus4: {
    id: 'attackPlus4',
    label: '普攻 4',
    description: '经过打磨的强力平A，没有冷却。',
    classId: 'warrior',
    tags: ['warrior', 'strike'],
    cooldown: 0,
    template: 'attack',
    numbers: {
      damageMultiplier: 1,
      bonusDamage: 3,
      blockGain: 0,
    },
  },
  heavyStrike: {
    id: 'heavyStrike',
    label: '重击',
    description: '更高伤害，冷却 2 回合。',
    classId: 'warrior',
    tags: ['warrior', 'strike'],
    cooldown: 2,
    template: 'attack',
    numbers: {
      damageMultiplier: 1.2,
      bonusDamage: 0,
      blockGain: 0,
    },
  },
  rend: {
    id: 'rend',
    label: '撕裂',
    description: '造成伤害并附加流血，冷却 2 回合。',
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
  },
  guard: {
    id: 'guard',
    label: '格挡',
    description: '造成 0 点伤害并获得 5 点格挡，冷却 2 回合。',
    classId: 'warrior',
    tags: ['warrior', 'block'],
    cooldown: 2,
    template: 'gainBlock',
    numbers: {
      damageMultiplier: 0,
      bonusDamage: 0,
      blockGain: 5,
    },
  },
};

export const defaultBattlePriority: BattleSkillId[] = ['heavyStrike', 'guard', 'attack'];
export const defaultUnlockedBattleSkills: BattleSkillId[] = ['attack', 'heavyStrike', 'guard'];
export const mockBattleSkillDropPool: BattleSkillId[] = ['rend', 'attackPlus2', 'attackPlus3', 'attackPlus4'];
