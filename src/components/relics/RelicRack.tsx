import { relicDefinitions } from '../../core/relics/relics';
import type { RunRelic } from '../../types';
import { HoverDetail } from '../ui/HoverDetail';
import { InfoCard } from '../ui/InfoCard';
import { RelicBadge } from './RelicBadge';

interface RelicRackProps {
  relics: RunRelic[];
}

export function RelicRack({ relics }: RelicRackProps) {
  return (
    <InfoCard
      label="Relics"
      title="遗物栏"
      description={relics.length > 0 ? '局内遗物会在战斗相关链路中生效。' : '本局暂时还没有获得任何遗物。'}
      className="grid gap-3"
    >
      <div className="mt-3 flex flex-wrap gap-2">
        {relics.length > 0 ? (
          relics.map((relic, index) => {
            const definition = relicDefinitions[relic.id];
            const stackSuffix = relic.stacks && relic.stacks > 1 ? ` ×${relic.stacks}` : '';
            return (
              <HoverDetail
                key={`${relic.id}-${index}`}
                align="left"
                title={`${definition.label}${stackSuffix}`}
                description={definition.description}
                trigger={<RelicBadge relic={relic} label={definition.label} />}
              />
            );
          })
        ) : (
          <span className="rounded-xl border border-dashed border-[rgba(242,230,201,0.14)] px-3 py-3 text-xs tracking-[0.14em] text-[var(--color-text-muted)]">
            暂无遗物
          </span>
        )}
      </div>
    </InfoCard>
  );
}

