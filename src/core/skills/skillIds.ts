export const battleSkillIds = [
  'attack',
  'heavyStrike',
  'guard',
  'rend',
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
] as const;

export type BattleSkillId = (typeof battleSkillIds)[number];

