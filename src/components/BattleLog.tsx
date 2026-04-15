import type { BattleLogEntry } from '../types';
import { Panel } from './ui/Panel';
import { StatusBadge } from './ui/StatusBadge';

interface BattleLogProps {
  entries: BattleLogEntry[];
}

interface BattleLogGroup {
  round?: number;
  title: string;
  entries: BattleLogEntry[];
}

function groupEntries(entries: BattleLogEntry[]) {
  const groups: BattleLogGroup[] = [];
  let currentRoundGroup: BattleLogGroup | null = null;
  let systemGroup: BattleLogGroup | null = null;

  for (const entry of entries) {
    if (entry.kind === 'round') {
      const nextRoundGroup: BattleLogGroup = {
        title: entry.text,
        entries: [],
        ...(entry.round !== undefined ? { round: entry.round } : {}),
      };
      currentRoundGroup = nextRoundGroup;
      groups.push(nextRoundGroup);
      continue;
    }

    if (entry.round && currentRoundGroup?.round === entry.round) {
      currentRoundGroup.entries.push(entry);
      continue;
    }

    if (!systemGroup) {
      systemGroup = {
        title: '战斗开始',
        entries: [],
      };
      groups.unshift(systemGroup);
    }

    systemGroup.entries.push(entry);
  }

  return groups;
}

function getBadgeTone(kind: BattleLogEntry['kind']): 'accent' | 'bright' {
  return kind === 'enemy_action' || kind === 'result' ? 'bright' : 'accent';
}

function getBadgeLabel(kind: BattleLogEntry['kind']) {
  switch (kind) {
    case 'hero_action':
      return '我方';
    case 'enemy_action':
      return '敌方';
    case 'status':
      return '状态';
    case 'result':
      return '结果';
    default:
      return '系统';
  }
}

function getEntryClassName(kind: BattleLogEntry['kind']) {
  switch (kind) {
    case 'hero_action':
      return 'border-[rgba(195,138,51,0.28)] bg-[rgba(195,138,51,0.08)] text-[var(--color-text-main)]';
    case 'enemy_action':
      return 'border-[rgba(240,193,91,0.24)] bg-[rgba(240,193,91,0.06)] text-[var(--color-text-main)]';
    case 'result':
      return 'border-[rgba(240,193,91,0.32)] bg-[rgba(240,193,91,0.08)] text-[var(--color-accent-bright)]';
    case 'status':
      return 'border-[rgba(242,230,201,0.1)] bg-[rgba(15,12,10,0.22)] text-[var(--color-text-muted)]';
    default:
      return 'border-[rgba(242,230,201,0.12)] bg-[rgba(242,230,201,0.03)] text-[var(--color-text-muted)]';
  }
}

export function BattleLog({ entries }: BattleLogProps) {
  const groups = groupEntries(entries);

  return (
    <Panel className="grid gap-4">
      <div className="flex items-center justify-between gap-3 border-b border-[rgba(242,230,201,0.12)] pb-4">
        <h3 className="m-0 text-lg font-bold tracking-[0.08em] text-[var(--color-text-main)]">战斗日志</h3>
        <StatusBadge>Round View</StatusBadge>
      </div>
      <div className="scrollbar-ember grid max-h-[320px] gap-4 overflow-auto pr-1">
        {groups.map((group, groupIndex) => (
          <section
            key={`${group.title}-${groupIndex}`}
            className="grid gap-3 rounded-[24px] border border-[rgba(242,230,201,0.1)] bg-[rgba(15,12,10,0.28)] p-4"
          >
            <div className="flex items-center justify-between gap-3 border-b border-dashed border-[rgba(242,230,201,0.12)] pb-3">
              <h4 className="m-0 text-sm font-bold tracking-[0.18em] text-[var(--color-text-main)]">{group.title}</h4>
              {group.round ? <StatusBadge tone="bright">R{group.round}</StatusBadge> : <StatusBadge>System</StatusBadge>}
            </div>

            {group.entries.length > 0 ? (
              <div className="grid gap-2">
                {group.entries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`grid gap-2 rounded-2xl border px-3 py-3 ${getEntryClassName(entry.kind)}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={getBadgeTone(entry.kind)}>{getBadgeLabel(entry.kind)}</StatusBadge>
                      {entry.actor ? <span className="text-xs font-semibold tracking-[0.08em] opacity-80">{entry.actor}</span> : null}
                    </div>
                    <p className="m-0 text-sm leading-6">{entry.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="m-0 text-sm leading-6 text-[var(--color-text-muted)]">本回合尚无更多事件。</p>
            )}
          </section>
        ))}
      </div>
    </Panel>
  );
}
