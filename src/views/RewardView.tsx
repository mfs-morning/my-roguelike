import { BattleLog } from '../components/BattleLog';
import { Button } from '../components/ui/Button';
import { Panel } from '../components/ui/Panel';
import { SectionTitle } from '../components/ui/SectionTitle';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useGameStore } from '../store/useGameStore';

const nonBattleRewardKinds = new Set(['treasure', 'blessing', 'rest', 'event']);

export function RewardView() {
  const pendingReward = useGameStore((state) => state.pendingReward);
  const generatedMap = useGameStore((state) => state.generatedMap);
  const battleLog = useGameStore((state) => state.battleLog);
  const claimReward = useGameStore((state) => state.claimReward);

  const clearedCount = generatedMap.nodes.filter((node) => node.cleared).length;

  if (!pendingReward) {
    return (
      <Panel className="grid gap-6">
        <SectionTitle eyebrow="结算" title="当前没有待领取奖励" />
        <div>
          <Button onClick={() => claimReward()}>返回继续</Button>
        </div>
      </Panel>
    );
  }

  const isVictory = pendingReward.outcome === 'victory';
  const showBattleLog = !nonBattleRewardKinds.has(pendingReward.kind);

  return (
    <section className="grid gap-5">
      <Panel className="grid gap-6">
        <SectionTitle
          eyebrow="结算"
          title={pendingReward.title}
          description={pendingReward.description}
        />

        <div className="flex flex-wrap gap-2">
          <StatusBadge tone={isVictory ? 'bright' : 'accent'}>
            {isVictory ? '结算完成' : '冒险失败'}
          </StatusBadge>
          {pendingReward.gold > 0 ? <StatusBadge tone="bright">金币 +{pendingReward.gold}</StatusBadge> : null}
          {pendingReward.maxHpBoost > 0 ? <StatusBadge tone="bright">生命上限 +{pendingReward.maxHpBoost}</StatusBadge> : null}
          {pendingReward.attackBoost > 0 ? <StatusBadge tone="bright">攻击 +{pendingReward.attackBoost}</StatusBadge> : null}
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

        {pendingReward.choices && pendingReward.choices.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {pendingReward.choices.map((choice) => (
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
        ) : (
          <div>
            <Button onClick={() => claimReward()}>{isVictory ? '继续前进' : '返回城镇'}</Button>
          </div>
        )}
      </Panel>

      {showBattleLog ? <BattleLog entries={battleLog} /> : null}
    </section>
  );
}
