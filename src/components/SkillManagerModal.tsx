import { useEffect, useState } from 'react';
import type {
  BattleSkillDefinition,
  BattleSkillExtraEffect,
  BattleSkillId,
  BattleTacticCondition,
  BattleTacticConditionKind,
  BattleTacticSlot,
} from '../types';
import { Button } from './ui/Button';

interface SkillManagerModalProps {
  isOpen: boolean;
  priority: BattleTacticSlot[];
  availableSkills: BattleSkillId[];
  skillsMap: Record<BattleSkillId, BattleSkillDefinition>;
  onClose: () => void;
  onSetCondition: (skillId: BattleSkillId, condition: BattleTacticCondition) => void;
  onEnableSkill: (skillId: BattleSkillId) => void;
  onDisableSkill: (skillId: BattleSkillId) => void;
  onReorderSkill: (fromSkillId: BattleSkillId, toSkillId: BattleSkillId) => void;
}

type SkillBucket = 'active' | 'inactive';

type TacticConditionPreset = BattleTacticConditionKind;

function formatExtraEffect(effect: BattleSkillExtraEffect) {
  const kindLabel = effect.kind === 'poison' ? '中毒' : '流血';
  const targetLabel = effect.target === 'enemy' ? '敌方' : '自身';
  const durationText = effect.duration ? `，持续 ${effect.duration} 回合` : '';
  return `${targetLabel}附加${kindLabel} ${effect.value} 点${durationText}`;
}

function getConditionLabel(condition: BattleTacticCondition) {
  if (condition.kind === 'always') {
    return '始终释放';
  }

  if (condition.kind === 'enemy_hp_below_percent') {
    return `敌方生命 < ${condition.value}%`;
  }

  return `自身生命 < ${condition.value}%`;
}

function getConditionPreset(condition: BattleTacticCondition): TacticConditionPreset {
  return condition.kind;
}

function createConditionFromPreset(preset: TacticConditionPreset): BattleTacticCondition {
  if (preset === 'enemy_hp_below_percent') {
    return { kind: 'enemy_hp_below_percent', value: 30 };
  }

  if (preset === 'hero_hp_below_percent') {
    return { kind: 'hero_hp_below_percent', value: 50 };
  }

  return { kind: 'always' };
}

function getConditionOptionLabel(kind: TacticConditionPreset) {
  if (kind === 'enemy_hp_below_percent') {
    return '敌方生命 < 30%';
  }

  if (kind === 'hero_hp_below_percent') {
    return '自身生命 < 50%';
  }

  return '始终释放';
}

export function SkillManagerModal({
  isOpen,
  priority,
  availableSkills,
  skillsMap,
  onClose,
  onSetCondition,
  onEnableSkill,
  onDisableSkill,
  onReorderSkill,
}: SkillManagerModalProps) {
  const [draggingSkillId, setDraggingSkillId] = useState<BattleSkillId | null>(null);
  const [dragSource, setDragSource] = useState<SkillBucket | null>(null);
  const [hoverBucket, setHoverBucket] = useState<SkillBucket | null>(null);
  const [hoverSkillId, setHoverSkillId] = useState<BattleSkillId | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setDraggingSkillId(null);
      setDragSource(null);
      setHoverBucket(null);
      setHoverSkillId(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const activeSkillIds = priority.map((slot) => slot.skillId);
  const inactiveSkills = availableSkills.filter((skillId) => !activeSkillIds.includes(skillId));

  const resetDragState = () => {
    setDraggingSkillId(null);
    setDragSource(null);
    setHoverBucket(null);
    setHoverSkillId(null);
  };

  const moveSkill = (skillId: BattleSkillId, target: SkillBucket) => {
    if (target === 'active') {
      if (!activeSkillIds.includes(skillId)) {
        onEnableSkill(skillId);
      }
      return;
    }

    if (activeSkillIds.includes(skillId) && priority.length > 1) {
      onDisableSkill(skillId);
    }
  };

  const renderSkillCard = (slotOrSkillId: BattleTacticSlot | BattleSkillId, source: SkillBucket, index?: number) => {
    const slot = typeof slotOrSkillId === 'string' ? null : slotOrSkillId;
    const skillId = typeof slotOrSkillId === 'string' ? slotOrSkillId : slotOrSkillId.skillId;
    const skill = skillsMap[skillId];
    const extraEffectText = skill.numbers.extraEffects?.map(formatExtraEffect).join('；');
    const isDragging = draggingSkillId === skillId;
    const availableConditions = skill.availableConditions;
    const target = source === 'active' ? 'inactive' : 'active';
    const arrow = source === 'active' ? '→' : '←';
    const actionDisabled = source === 'active' && priority.length <= 1;

    return (
      <div
        key={skillId}
        draggable={!actionDisabled}
        onDragStart={() => {
          if (actionDisabled) {
            return;
          }
          setDraggingSkillId(skillId);
          setDragSource(source);
          setHoverSkillId(null);
        }}
        onDragOver={(event) => {
          if (source === 'active' && dragSource === 'active') {
            event.preventDefault();
            setHoverSkillId(skillId);
            setHoverBucket(null);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          if (source === 'active' && dragSource === 'active' && draggingSkillId && draggingSkillId !== skillId) {
            onReorderSkill(draggingSkillId, skillId);
          }
          resetDragState();
        }}
        onDragEnd={resetDragState}
        className={[
          'group rounded-2xl border px-4 py-3 transition-all duration-150',
          isDragging
            ? 'scale-[0.985] border-[rgba(240,193,91,0.32)] bg-[rgba(240,193,91,0.08)] opacity-70'
            : 'border-[rgba(242,230,201,0.1)] bg-[rgba(0,0,0,0.18)] hover:border-[rgba(240,193,91,0.24)] hover:bg-[rgba(242,230,201,0.05)]',
          source === 'active' && !actionDisabled ? 'hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(0,0,0,0.16)]' : '',
          hoverSkillId === skillId && draggingSkillId !== skillId && dragSource === 'active'
            ? 'ring-1 ring-[rgba(240,193,91,0.35)]'
            : '',
          !actionDisabled ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed',
        ].join(' ')}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {typeof index === 'number' ? (
                <span className="rounded-full border border-[rgba(242,230,201,0.12)] bg-[rgba(242,230,201,0.04)] px-2 py-0.5 text-[10px] font-bold tracking-[0.08em] text-[var(--color-text-muted)]">
                  #{index + 1}
                </span>
              ) : null}
              <strong className="text-sm tracking-[0.06em] text-[var(--color-text-main)]">{skill.label}</strong>
            </div>
            <p className="mt-2 text-xs leading-5 text-[var(--color-text-muted)]">{skill.description}</p>
            {extraEffectText ? <p className="mt-1 text-xs leading-5 text-[var(--color-accent-bright)]">{extraEffectText}</p> : null}
            {slot ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold tracking-[0.08em] text-[var(--color-text-muted)]">触发条件</span>
                <select
                  value={getConditionPreset(slot.condition)}
                  onChange={(event) => {
                    onSetCondition(skillId, createConditionFromPreset(event.target.value as TacticConditionPreset));
                  }}
                  onClick={(event) => event.stopPropagation()}
                  className="rounded-xl border border-[rgba(240,193,91,0.22)] bg-[rgba(20,16,14,0.9)] px-3 py-1.5 text-xs text-[var(--color-text-main)] outline-none"
                >
                  {availableConditions.map((conditionKind) => (
                    <option key={conditionKind} value={conditionKind}>
                      {getConditionOptionLabel(conditionKind)}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-[var(--color-accent-bright)]">{getConditionLabel(slot.condition)}</span>
              </div>
            ) : null}
          </div>
          <Button
            variant="secondary"
            className="shrink-0 px-3 py-1.5 text-sm transition-transform duration-150 group-hover:scale-105"
            onClick={() => moveSkill(skillId, target)}
            disabled={actionDisabled}
            title={actionDisabled ? '至少保留一个技能' : source === 'active' ? '移到待命列表' : '加入启用列表'}
          >
            {arrow}
          </Button>
        </div>
      </div>
    );
  };

  const sectionClass = (bucket: SkillBucket, tone: 'warm' | 'cool') => {
    const palette =
      tone === 'warm'
        ? {
            base: 'border-[rgba(240,193,91,0.16)] bg-[rgba(240,193,91,0.05)]',
            hover: 'border-[rgba(240,193,91,0.3)] bg-[rgba(240,193,91,0.1)]',
          }
        : {
            base: 'border-[rgba(96,165,250,0.18)] bg-[rgba(96,165,250,0.06)]',
            hover: 'border-[rgba(96,165,250,0.32)] bg-[rgba(96,165,250,0.12)]',
          };

    return [
      'rounded-3xl border p-4 transition-all duration-150',
      hoverBucket === bucket ? palette.hover : palette.base,
    ].join(' ');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(6,4,3,0.72)] px-4 py-6 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-5xl rounded-[28px] border border-[rgba(242,230,201,0.14)] bg-[linear-gradient(180deg,rgba(26,20,18,0.98),rgba(13,10,9,0.98))] p-5 shadow-[0_32px_120px_rgba(0,0,0,0.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[rgba(242,230,201,0.1)] pb-4">
          <div>
            <p className="m-0 text-xs uppercase tracking-[0.22em] text-[var(--color-accent-bright)]">Tactical Loadout</p>
            <h3 className="mt-2 text-xl font-bold tracking-[0.08em] text-[var(--color-text-main)]">战术槽管理</h3>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">拖动调整释放顺序，并给启用中的技能设置触发条件。</p>
          </div>
          <Button variant="secondary" className="px-3 py-2 text-sm" onClick={onClose}>
            关闭
          </Button>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <section
            className={sectionClass('active', 'warm')}
            onDragOver={(event) => {
              if (dragSource === 'inactive') {
                event.preventDefault();
                setHoverBucket('active');
                setHoverSkillId(null);
              }
            }}
            onDragLeave={() => {
              if (hoverBucket === 'active') {
                setHoverBucket(null);
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (draggingSkillId && dragSource === 'inactive') {
                moveSkill(draggingSkillId, 'active');
              }
              resetDragState();
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="m-0 text-sm font-bold tracking-[0.08em] text-[var(--color-text-main)]">已启用战术槽</h4>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">这些技能会按顺序检查条件并自动释放。</p>
              </div>
              <span className="rounded-full border border-[rgba(240,193,91,0.24)] bg-[rgba(240,193,91,0.12)] px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] text-[var(--color-accent-bright)]">
                {priority.length}
              </span>
            </div>

            <div className="mt-4 grid gap-3">
              {priority.map((slot, index) => renderSkillCard(slot, 'active', index))}
            </div>
          </section>

          <section
            className={sectionClass('inactive', 'cool')}
            onDragOver={(event) => {
              if (dragSource === 'active' && priority.length > 1) {
                event.preventDefault();
                setHoverBucket('inactive');
                setHoverSkillId(null);
              }
            }}
            onDragLeave={() => {
              if (hoverBucket === 'inactive') {
                setHoverBucket(null);
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (draggingSkillId && dragSource === 'active' && priority.length > 1) {
                moveSkill(draggingSkillId, 'inactive');
              }
              resetDragState();
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="m-0 text-sm font-bold tracking-[0.08em] text-[var(--color-text-main)]">待命技能</h4>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">以后拿到更强技能时，可以在这里替换旧技能。</p>
              </div>
              <span className="rounded-full border border-[rgba(96,165,250,0.24)] bg-[rgba(96,165,250,0.12)] px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] text-sky-200">
                {inactiveSkills.length}
              </span>
            </div>

            <div className="mt-4 grid gap-3">
              {inactiveSkills.length > 0 ? (
                inactiveSkills.map((skillId) => renderSkillCard(skillId, 'inactive'))
              ) : (
                <div className="rounded-2xl border border-dashed border-[rgba(242,230,201,0.16)] bg-[rgba(242,230,201,0.03)] px-4 py-6 text-center text-sm text-[var(--color-text-muted)]">
                  当前没有待命技能，已全部加入自动释放队列。
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
