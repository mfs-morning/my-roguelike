export const battleSkillIds = [
  'attack', // 普攻
  'heavyStrike', // 重击
  'guard', // 格挡
  'rend', // 撕裂
  'sweepingSlash', // 横扫
  'quakeSmash', // 震地猛砸
  'piercingThrust', // 穿阵突刺
  'meteorHammer', // 流星锤
  'executioner', // 断头斩
  'bloodburst', // 裂伤引爆
  'ironAssault', // 铁壁强袭
  'holdTheLine', // 稳守反击
  'venomEdge', // 淬毒刃
  'crimsonHarvest', // 猩红收割
  'whirlwind', // 回旋斩
  'shockwave', // 冲击波
  'backlineCrusher', // 破阵重压
  'reaperRush', // 死线突进
  'toxicDetonation', // 毒爆
  'shieldRam', // 盾撞
  'siegebreaker', // 攻城断壁
  'stormVault', // 雷跃突围
  'skullsplitter', // 裂颅处刑
  'scarletDrill', // 猩红贯刺
  'graveHook', // 冥钩回扯
  'bulwarkRiposte', // 壁垒回击
  'warBannerCrash', // 战旗坠袭
  'toxinReap', // 噬毒收割
  'cataclysmSweep', // 灾厄横扫
  'lastStand', // 背水死斗
] as const;

export type BattleSkillId = (typeof battleSkillIds)[number];

