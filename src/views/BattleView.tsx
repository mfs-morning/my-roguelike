import { BattleLog } from '../components/BattleLog';
import { Button } from '../components/ui/Button';
import { HealthBar } from '../components/ui/HealthBar';
import { InfoCard } from '../components/ui/InfoCard';
import { Panel } from '../components/ui/Panel';
import { SectionTitle } from '../components/ui/SectionTitle';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useGameLoop } from '../hooks/useGameLoop';
import { enemySkills } from '../core/skills/enemySkills';
import type { BattleStatusEffect, EnemySkillDefinition } from '../types';
import { useGameStore } from '../store/useGameStore';

interface BattleViewProps {
  isReordering?: boolean;
}

const statusToneMap: Record<BattleStatusEffect['kind'], 'accent' | 'bright'> = {
  poison: 'accent',
  bleed: 'bright',
};

function getStatusLabel(effect: BattleStatusEffect) {
  const kindLabel = effect.kind === 'poison' ? '中毒' : '流血';
  return `${kindLabel} ${effect.value}/${effect.duration}`;
}

function getEnemyActionBadgeTone(skill: EnemySkillDefinition | undefined): 'accent' | 'bright' {
  if (!skill) {
    return 'accent';
  }

  return skill.template === 'gainBlock' ? 'bright' : 'accent';
}

export function BattleView({ isReordering = false }: BattleViewProps) {
  const hero = useGameStore((state) => state.hero);
  const enemy = useGameStore((state) => state.enemy);
  const battleLog = useGameStore((state) => state.battleLog);
  const runBattleRound = useGameStore((state) => state.runBattleRound);
  const setView = useGameStore((state) => state.setView);
  const currentEnemySkill = enemy.tacticsProfile.tactics.find((slot) => (enemy.enemyCooldowns[slot.skillId] ?? 0) === 0)
    ? enemySkills[enemy.tacticsProfile.tactics.find((slot) => (enemy.enemyCooldowns[slot.skillId] ?? 0) === 0)!.skillId]
    : undefined;

  const canFight = hero.stats.hp > 0 && enemy.stats.hp > 0;

  useGameLoop(runBattleRound, 1500, canFight && !isReordering);

  return (
    <section className="grid gap-5">
      <Panel className="grid gap-6">
        <SectionTitle
          eyebrow="战斗"
          title="战斗进程"
          description="左侧面板可以随时拖动调整技能优先级；当前区域只负责展示战场与结算。"
        />

        <div className="grid gap-3 md:grid-cols-2">
          <InfoCard label="Hero" title={hero.name} description="前排承伤单位" className="grid gap-3">
            <HealthBar value={hero.stats.hp} max={hero.stats.maxHp} />
            <div className="flex flex-wrap gap-2">
              {hero.statusEffects.length > 0 ? (
                hero.statusEffects.map((effect, index) => (
                  <StatusBadge key={`${effect.kind}-${index}`} tone={statusToneMap[effect.kind]}>
                    {getStatusLabel(effect)}
                  </StatusBadge>
                ))
              ) : (
                <StatusBadge>无状态</StatusBadge>
              )}
            </div>
          </InfoCard>
          <InfoCard label="Enemy" title={enemy.name} description="当前遭遇的敌人" className="grid gap-3">
            <HealthBar value={enemy.stats.hp} max={enemy.stats.maxHp} tone="enemy" />
            <div className="flex flex-wrap gap-2">
              <StatusBadge>{enemy.tacticsProfile.label}</StatusBadge>
              {currentEnemySkill ? (
                <StatusBadge tone={getEnemyActionBadgeTone(currentEnemySkill)}>{currentEnemySkill.label}</StatusBadge>
              ) : null}
            </div>
            <p className="m-0 text-sm leading-6 text-[var(--color-text-muted)]">{enemy.tacticsProfile.description}</p>
            <div className="flex flex-wrap gap-2">
              {enemy.statusEffects.length > 0 ? (
                enemy.statusEffects.map((effect, index) => (
                  <StatusBadge key={`${effect.kind}-${index}`} tone={statusToneMap[effect.kind]}>
                    {getStatusLabel(effect)}
                  </StatusBadge>
                ))
              ) : (
                <StatusBadge>无状态</StatusBadge>
              )}
            </div>
          </InfoCard>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={runBattleRound} disabled={!canFight}>
            立即结算一轮
          </Button>
          <Button variant="secondary" onClick={() => setView('map')}>
            返回地图
          </Button>
        </div>
      </Panel>

      <BattleLog entries={battleLog} />
    </section>
  );
}
