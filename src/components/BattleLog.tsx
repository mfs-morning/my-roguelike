import type { BattleLogEntry } from '../types';
import { Panel } from './ui/Panel';
import { StatusBadge } from './ui/StatusBadge';

interface BattleLogProps {
  entries: BattleLogEntry[];
}

export function BattleLog({ entries }: BattleLogProps) {
  const latestFirstEntries = [...entries].reverse();

  return (
    <Panel className="grid gap-4">
      <div className="flex items-center justify-between gap-3 border-b border-[rgba(242,230,201,0.12)] pb-4">
        <h3 className="m-0 text-lg font-bold tracking-[0.08em] text-[var(--color-text-main)]">战斗日志</h3>
        <StatusBadge>Live Feed</StatusBadge>
      </div>
      <div className="scrollbar-ember grid max-h-[240px] gap-3 overflow-auto pr-1">
        {/* 最新日志显示在最上方。 */}
        {latestFirstEntries.map((entry) => (
          <p
            key={entry.id}
            className="m-0 border-b border-dashed border-[rgba(242,230,201,0.12)] pb-3 text-sm leading-6 text-[var(--color-text-muted)]"
          >
            {entry.text}
          </p>
        ))}
      </div>
    </Panel>
  );
}
