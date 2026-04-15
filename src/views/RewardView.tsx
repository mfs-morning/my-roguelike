import { battleSkills } from '../core/skills/skills';
import { getNextPlayableNodes } from '../core/map/mapProgress';
import type { BattleSkillTag, CharacterClassId } from '../types';
import { BattleLog } from '../components/BattleLog';
import { Button } from '../components/ui/Button';
import { HoverDetail } from '../components/ui/HoverDetail';
import { Panel } from '../components/ui/Panel';
import { SectionTitle } from '../components/ui/SectionTitle';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useGameStore } from '../store/useGameStore';

const nonBattleRewardKinds = new Set(['treasure', 'blessing', 'rest', 'event']);

const classLabelMap: Record<CharacterClassId, string> = {
  warrior: '战士',
  rogue: '游荡者',
  mage: '法师',
};

const tagLabelMap: Record<BattleSkillTag, string> = {
  warrior: '战士',
  rogue: '游荡者',
  mage: '法师',
  bleed: '流血',
  poison: '中毒',
  block: '格挡',
  strike: '打击',
};

export function RewardView() {
  const pendingReward = useGameStore((state) => state.pendingReward);
  const generatedMap = useGameStore((state) => state.generatedMap);
  const battleLog = useGameStore((state) => state.battleLog);
  const claimReward = useGameStore((state) => state.claimReward);
  const setView = useGameStore((state) => state.setView);

  const clearedCount = generatedMap.nodes.filter((node) => node.cleared).length;
  const nextView = getNextPlayableNodes(generatedMap).length === 0 ? 'town' : 'map';

  if (!pendingReward) {
    return (
      <section className="grid gap-5">
        <Panel className="grid gap-6">
          <SectionTitle eyebrow="结算" title="奖励已领取" description="你可以先检查战斗日志，再决定何时继续前进。" />
          <div className="flex flex-wrap gap-2">
            <StatusBadge>已清理 {clearedCount}/{generatedMap.nodes.length}</StatusBadge>
          </div>
          <div>
            <Button onClick={() => setView(nextView)}>{nextView === 'town' ? '返回城镇' : '继续前进'}</Button>
          </div>
        </Panel>

        <BattleLog entries={battleLog} />
      </section>
    );
  }

  const isVictory = pendingReward.outcome === 'victory';
  const showBattleLog = !nonBattleRewardKinds.has(pendingReward.kind);
  const skillChoices = (pendingReward.choices ?? []).filter((choice) => choice.grantedSkillId);
  const normalChoices = (pendingReward.choices ?? []).filter((choice) => !choice.grantedSkillId);

  return (
    <section className="grid gap-5">
      <Panel className="grid gap-6">
        <SectionTitle eyebrow="结算" title={pendingReward.title} description={pendingReward.description} />

        <div className="flex flex-wrap gap-2">
          <StatusBadge tone={isVictory ? 'bright' : 'accent'}>{isVictory ? '结算完成' : '冒险失败'}</StatusBadge>
          {pendingReward.gold > 0 ? <StatusBadge tone="bright">金币 +{pendingReward.gold}</StatusBadge> : null}
          {pendingReward.maxHpBoost > 0 ? <StatusBadge tone="bright">生命上限 +{pendingReward.maxHpBoost}</StatusBadge> : null}
          {pendingReward.strengthBoost > 0 ? <StatusBadge tone="bright">力量 +{pendingReward.strengthBoost}</StatusBadge> : null}
          {pendingReward.heal > 0 ? <StatusBadge tone="bright">回复 +{pendingReward.heal}</StatusBadge> : null}
          <StatusBadge>已清理 {clearedCount}/{generatedMap.nodes.length}</StatusBadge>
        </div>

        {pendingReward.battleSummary ? (
          <div className="rounded-2xl border border-[rgba(240,193,91,0.18)] bg-[rgba(240,193,91,0.08)] px-4 py-3 text-sm leading-6 text-[var(--color-text-main)]">
            <strong className="block text-xs uppercase tracking-[0.18em] text-[var(--color-accent-bright)]">本场战斗摘要</strong>
            <div className="mt-3 grid gap-2 text-sm text-[var(--color-text-main)] sm:grid-cols-2">
              <div className="rounded-xl bg-[rgba(0,0,0,0.14)] px-3 py-2">总回合数：{pendingReward.battleSummary.rounds}</div>
              <div className="rounded-xl bg-[rgba(0,0,0,0.14)] px-3 py-2">总造成伤害：{pendingReward.battleSummary.totalDamageDealt}</div>
              <div className="rounded-xl bg-[rgba(0,0,0,0.14)] px-3 py-2">总承受伤害：{pendingReward.battleSummary.totalDamageTaken}</div>
              <div className="rounded-xl bg-[rgba(0,0,0,0.14)] px-3 py-2">剩余生命：{pendingReward.battleSummary.remainingHp}</div>
            </div>
          </div>
        ) : null}

        {skillChoices.length > 0 ? (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(6,4,3,0.72)] px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-5xl rounded-[28px] border border-[rgba(242,230,201,0.14)] bg-[linear-gradient(180deg,rgba(26,20,18,0.98),rgba(13,10,9,0.98))] p-5 shadow-[0_32px_120px_rgba(0,0,0,0.45)]">
              <div className="flex items-start justify-between gap-4 border-b border-[rgba(242,230,201,0.1)] pb-4">
                <div>
                  <p className="m-0 text-xs uppercase tracking-[0.22em] text-[var(--color-accent-bright)]">Skill Reward</p>
                  <h3 className="mt-2 text-xl font-bold tracking-[0.08em] text-[var(--color-text-main)]">
                    选择一个技能带走
                  </h3>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                    当前可选 {skillChoices.length} 个技能，你也可以跳过，什么都不拿。
                  </p>
                </div>
                <Button variant="secondary" className="px-3 py-2 text-sm" onClick={() => claimReward()}>
                  跳过
                </Button>
              </div>

              <div className={`mt-5 grid gap-4 ${skillChoices.length >= 3 ? 'lg:grid-cols-3' : 'md:grid-cols-2'}`}>
                {skillChoices.map((choice) => {
                  const skill = choice.grantedSkillId ? battleSkills[choice.grantedSkillId] : null;
                  const hoverDescription = skill ? `${skill.description} ${skill.effectDescription}`.trim() : choice.description;

                  return (
                    <HoverDetail
                      key={choice.id}
                      align="center"
                      title={choice.label}
                      description={hoverDescription}
                      className="w-full"
                      trigger={
                        <button
                          type="button"
                          onClick={() => claimReward(choice.id)}
                          className="group w-full rounded-[24px] border border-[rgba(96,165,250,0.2)] bg-[linear-gradient(180deg,rgba(96,165,250,0.1),rgba(15,23,42,0.35))] p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-[rgba(96,165,250,0.45)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <StatusBadge tone="bright">技能</StatusBadge>
                            <span className="text-lg text-sky-200 transition-transform duration-200 group-hover:translate-x-1">→</span>
                          </div>
                          <strong className="mt-4 block text-lg tracking-[0.06em] text-[var(--color-text-main)]">{choice.label}</strong>
                          <p className="mt-3 mb-0 text-sm leading-6 text-[var(--color-text-muted)]">{choice.description}</p>
                          {skill ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              <StatusBadge>{classLabelMap[skill.classId]}</StatusBadge>
                              {skill.tags.map((tag) => (
                                <StatusBadge key={`${choice.id}-${tag}`} tone="bright">
                                  {tagLabelMap[tag]}
                                </StatusBadge>
                              ))}
                            </div>
                          ) : null}
                        </button>
                      }
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {normalChoices.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {normalChoices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => claimReward(choice.id)}
                className="rounded-2xl border border-[rgba(242,230,201,0.12)] bg-[rgba(242,230,201,0.04)] p-4 text-left transition hover:border-[rgba(240,193,91,0.45)] hover:bg-[rgba(240,193,91,0.08)]"
              >
                <strong className="block text-base text-[var(--color-text-main)]">{choice.label}</strong>
                <p className="mt-2 mb-0 text-sm leading-6 text-[var(--color-text-muted)]">{choice.description}</p>
              </button>
            ))}
          </div>
        ) : skillChoices.length === 0 ? (
          <div>
            <Button onClick={() => claimReward()}>{isVictory ? '继续前进' : '返回城镇'}</Button>
          </div>
        ) : null}
      </Panel>

      {showBattleLog ? <BattleLog entries={battleLog} /> : null}
    </section>
  );
}
