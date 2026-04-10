import { StatusBadge } from './ui/StatusBadge';
import type { Room } from '../types';

interface MapNodeProps {
  room: Room;
  active?: boolean;
  selectable?: boolean;
  onClick?: (() => void) | undefined;
}

const kindLabelMap: Record<Room['kind'], string> = {
  battle: '战斗',
  elite: '精英',
  event: '事件',
  treasure: '宝箱',
  blessing: '祝福',
  boss: 'Boss',
  rest: '休整',
};

const kindClassMap: Record<Room['kind'], string> = {
  battle: 'border-[rgba(195,138,51,0.3)] bg-[linear-gradient(180deg,rgba(195,138,51,0.18),rgba(195,138,51,0.04))]',
  elite: 'border-[rgba(239,68,68,0.35)] bg-[linear-gradient(180deg,rgba(127,29,29,0.26),rgba(69,10,10,0.08))]',
  event: 'border-[rgba(148,163,184,0.35)] bg-[linear-gradient(180deg,rgba(71,85,105,0.22),rgba(30,41,59,0.08))]',
  treasure: 'border-[rgba(234,179,8,0.35)] bg-[linear-gradient(180deg,rgba(202,138,4,0.22),rgba(120,53,15,0.08))]',
  blessing: 'border-[rgba(34,197,94,0.35)] bg-[linear-gradient(180deg,rgba(22,163,74,0.22),rgba(20,83,45,0.08))]',
  boss: 'border-[rgba(168,85,247,0.35)] bg-[linear-gradient(180deg,rgba(88,28,135,0.26),rgba(59,7,100,0.08))]',
  rest: 'border-[rgba(96,165,250,0.35)] bg-[linear-gradient(180deg,rgba(37,99,235,0.22),rgba(30,58,138,0.08))]',
};

export function MapNode({ room, active = false, selectable = false, onClick }: MapNodeProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!selectable && !onClick}
      className={[
        'grid min-h-[128px] gap-3 rounded-2xl border px-4 py-4 text-left transition-all duration-200',
        kindClassMap[room.kind],
        selectable ? 'cursor-pointer hover:-translate-y-0.5 hover:opacity-100' : 'cursor-default',
        room.cleared ? 'opacity-55' : 'opacity-90',
        active ? 'shadow-[0_0_0_1px_#f0c15b,0_0_32px_rgba(240,193,91,0.22)]' : '',
      ].join(' ')}
    >
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[rgba(0,0,0,0.35)] text-sm font-bold text-[var(--color-text-main)]">
        {room.depth}
      </span>
      <strong className="text-base tracking-[0.04em] text-[var(--color-text-main)]">{room.label}</strong>
      <div className="flex items-center gap-2">
        <StatusBadge className="w-fit text-[0.72rem]">{kindLabelMap[room.kind]}</StatusBadge>
        {room.cleared ? <StatusBadge tone="bright">已清理</StatusBadge> : null}
      </div>
    </button>
  );
}
