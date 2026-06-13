import { RankTierIcon } from "@/components/shared/rank-icon";
import type { RankTier } from "@/lib/honey/rank-tiers";

/** Small square badge — tinted by the tier color, showing its image or icon. */
export function TierBadge({ tier }: { tier: RankTier }) {
  return (
    <div
      className="flex size-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-border/40"
      style={{
        backgroundColor: tier.color ? `${tier.color}1a` : undefined,
        color: tier.color ?? undefined,
      }}
    >
      {tier.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tier.imageUrl}
          alt=""
          className="size-7 rounded object-contain"
        />
      ) : (
        <RankTierIcon name={tier.iconName} className="size-5" />
      )}
    </div>
  );
}
