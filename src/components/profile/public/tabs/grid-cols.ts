/**
 * Sparse-aware grid class helpers.
 *
 * The default profile grids are tuned for 4+ items (e.g. Listings goes up
 * to `xl:grid-cols-5`, Collection up to `xl:grid-cols-7`). When the actual
 * item count is small, those wide tracks turn the page into a single
 * lonely card with several columns of empty space.
 *
 * These helpers cap the number of columns + clamp the grid's max-width so
 * cards keep their natural ~180px size and the row ends right after the
 * last card instead of stretching across the viewport.
 *
 * Note: every class string is fully spelled out (no template
 * interpolation) so Tailwind's JIT can detect them.
 */

/**
 * Pick a grid class for the Listings tab based on filtered item count.
 * Up to ~5 cards on `xl` for the standard "lots of inventory" grid.
 *
 * When count === 1 we reserve a second cell for a hint tile (the consumer
 * is responsible for rendering it) so the single listing doesn't float in a
 * sea of empty space.
 */
export function listingsGridClass(count: number): string {
  if (count <= 1) {
    // Equal-width 2-column so the listing card and the companion hint tile
    // sit side-by-side as visual twins (both ≈220px) rather than the hint
    // hogging a wide cell. `max-w-md` keeps them feeling like a contained
    // pair instead of stretching across the panel.
    return "grid grid-cols-2 gap-3 md:gap-4 max-w-md";
  }
  if (count === 2) {
    return "grid grid-cols-2 gap-4 md:gap-5 max-w-md sm:max-w-xl";
  }
  if (count === 3) {
    return "grid grid-cols-2 gap-4 md:gap-5 sm:grid-cols-3 max-w-2xl";
  }
  if (count <= 6) {
    return "grid grid-cols-2 gap-4 md:gap-5 sm:grid-cols-3 lg:grid-cols-4";
  }
  return "grid grid-cols-2 gap-4 md:gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";
}

/**
 * Pick a grid class for the Collection tab based on filtered item count.
 * Cards are smaller (binder-style) so we go denser — up to 7 cols on `xl`.
 *
 * Like listings, count === 1 reserves a second wider cell for a hint tile
 * so the lone card doesn't look orphaned.
 */
export function collectionGridClass(count: number): string {
  if (count <= 1) {
    // Equal twins for the collection too — collection cards are ~120px so
    // the hint tile gets the same footprint and reads as a sibling.
    return "grid grid-cols-2 gap-2 max-w-[260px]";
  }
  if (count === 2) {
    return "grid grid-cols-2 gap-2 max-w-[260px]";
  }
  if (count === 3) {
    return "grid grid-cols-3 gap-2 max-w-[400px]";
  }
  if (count <= 6) {
    return "grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-2.5 md:grid-cols-5 max-w-3xl";
  }
  return "grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-2.5 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7";
}
