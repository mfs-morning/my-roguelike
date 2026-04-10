import { battleSkills, mockBattleSkillDropPool } from './skills';
import type { BattleReward, BattleSkillId, MapNodeData, RewardChoice } from '../types';

interface BuildRewardOptions {
  grantedSkillId?: BattleSkillId;
}

function buildChoice(
  id: string,
  label: string,
  description: string,
  partial: Omit<RewardChoice, 'id' | 'label' | 'description'>,
): RewardChoice {
  return {
    id,
    label,
    description,
    ...partial,
  };
}

export function rollBattleSkillDrop(
  node: MapNodeData,
  unlockedSkillIds: BattleSkillId[],
  clearedBattleCount: number,
): BattleSkillId | undefined {
  const remainingSkills = mockBattleSkillDropPool.filter((skillId) => !unlockedSkillIds.includes(skillId));
  if (remainingSkills.length === 0) {
    return undefined;
  }

  if (node.kind !== 'battle' && node.kind !== 'elite' && node.kind !== 'boss') {
    return undefined;
  }

  const guaranteedDrop = node.kind === 'elite' || node.kind === 'boss' || clearedBattleCount < 3;
  const randomDrop = Math.random() < 0.45;

  if (!guaranteedDrop && !randomDrop) {
    return undefined;
  }

  const randomIndex = Math.floor(Math.random() * remainingSkills.length);
  return remainingSkills[randomIndex];
}

export function buildReward(node: MapNodeData, options: BuildRewardOptions = {}): BattleReward {
  if (node.kind === 'treasure') {
    return {
      outcome: 'victory',
      nodeId: node.id,
      kind: node.kind,
      title: '打开宝箱',
      description: '宝箱里有几件能立刻派上用场的小收获，选一样带走。',
      gold: 0,
      maxHpBoost: 0,
      attackBoost: 0,
      heal: 0,
      choices: [
        buildChoice('gold-cache', '金币袋', '立即获得 16 金币。', { gold: 16, maxHpBoost: 0, attackBoost: 0, heal: 0 }),
        buildChoice('iron-edge', '磨亮刀锋', '攻击 +2。', { gold: 0, maxHpBoost: 0, attackBoost: 2, heal: 0 }),
      ],
    };
  }

  if (node.kind === 'blessing') {
    return {
      outcome: 'victory',
      nodeId: node.id,
      kind: node.kind,
      title: '接受祝福',
      description: '祝福之火给出两种不同方向的强化。',
      gold: 0,
      maxHpBoost: 0,
      attackBoost: 0,
      heal: 0,
      choices: [
        buildChoice('vital-blessing', '生命祝福', '生命上限 +5，并回复 5 点生命。', { gold: 0, maxHpBoost: 5, attackBoost: 0, heal: 5 }),
        buildChoice('fury-blessing', '锋锐祝福', '攻击 +2。', { gold: 0, maxHpBoost: 0, attackBoost: 2, heal: 0 }),
      ],
    };
  }

  if (node.kind === 'event') {
    return {
      outcome: 'victory',
      nodeId: node.id,
      kind: node.kind,
      title: '遭遇事件',
      description: '你在废墟里碰到一段插曲，只能挑一个结果带走。',
      gold: 0,
      maxHpBoost: 0,
      attackBoost: 0,
      heal: 0,
      choices: [
        buildChoice('event-gold', '捡走散币', '获得 10 金币。', { gold: 10, maxHpBoost: 0, attackBoost: 0, heal: 0 }),
        buildChoice('event-rest', '短暂整备', '回复 6 点生命。', { gold: 0, maxHpBoost: 0, attackBoost: 0, heal: 6 }),
      ],
    };
  }

  const skillText = options.grantedSkillId ? ` 你还缴获了技能【${battleSkills[options.grantedSkillId].label}】。` : '';

  return {
    outcome: 'victory',
    nodeId: node.id,
    kind: node.kind,
    title: node.kind === 'elite' ? '精英胜利' : node.kind === 'boss' ? 'Boss 胜利' : '战斗胜利',
    description:
      (node.kind === 'elite'
        ? '强敌已被击溃，你缴获了更多战利品。'
        : node.kind === 'boss'
          ? '守关者倒下了，你夺回了遗迹深处的宝藏。'
          : '你拿下了当前房间。') + skillText,
    gold: node.kind === 'elite' ? 12 : node.kind === 'boss' ? 20 : 5,
    maxHpBoost: 0,
    attackBoost: 0,
    heal: 0,
    grantedSkillId: options.grantedSkillId,
  };
}
