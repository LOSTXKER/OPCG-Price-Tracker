import { buildMarketColumns } from "@/components/market/market-columns"

// Search uses the canonical market table without Home's views-only column.
// Keep the runtime table and every loading boundary on the same registry so
// responsive column visibility cannot drift.
export const SEARCH_COLUMNS = buildMarketColumns({ showViews: false })
