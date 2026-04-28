import { createElement, type ComponentProps } from "react";
import { getRankIcon } from "@/lib/honey/rank-tiers";

type Props = ComponentProps<"svg"> & {
  name: string | null | undefined;
};

/**
 * Renders a Lucide icon by string name. Wrapped in a stable component so
 * call sites don't capture a "fresh" component reference inside render
 * (which would trip `react-hooks/static-components`).
 */
export function RankTierIcon({ name, ...rest }: Props) {
  return createElement(getRankIcon(name), rest);
}
