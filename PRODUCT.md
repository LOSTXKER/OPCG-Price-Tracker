# Product

> Synthesized from VISION.md / CLAUDE.md / DESIGN.md (the canonical docs). If this drifts from VISION.md, VISION.md wins.

## Register

product

## Users

Thai TCG collectors and traders (One Piece Card Game today, Pokémon next). They check card prices daily on their phone, track a portfolio of real money (thousands to hundreds of thousands of THB), watch for price swings, and buy/sell through the marketplace. Context: quick mobile sessions, money on the line — they need trustworthy numbers at a glance. Owner (เบส) is a non-coder; the product must feel self-evident.

## Product Purpose

Meecard is a real-time card-price reference + portfolio tracker + escrow marketplace for the Thai market. One screen answers "this card · this edition · this grade = this price" backed by credible sources (Yuyu-tei, SNKRDUNK). Success = collectors treat it like their trading dashboard (CoinMarketCap/Collectr for cards) and trust it enough to transact.

## Brand Personality

Warm premium, calm, trustworthy. Espresso near-black canvas + honey-gold accent + bear/honey identity. MONEY surfaces (portfolio, prices, escrow) are still and financial — no bounce. PLAY surfaces (decks, missions) get spring energy. Three words: warm, credible, uncluttered.

## Anti-references

- Generic shadcn-blue SaaS dashboards; boxed KPI-card grids ("hero-metric template").
- Classifieds boards (Kaidee-style) for the marketplace.
- Spreadsheet-dense pricing matrices (grade × source × edition all at once).
- Decorative chrome: gradients on data, glassmorphism, glow as decoration, nested cards.
- Cold near-black (Linear) — our dark is warm espresso.

## Design Principles

1. **การ์ด = พระเอก** — chrome stays espresso-neutral; card art is the only saturated thing.
2. **One hero number per screen** — everything else steps down the type ramp.
3. **Honest money** — green/red reserved for P/L only; inflows never fake gains; modeled values flagged.
4. **Frameless editorial calm** — structure from whitespace + hairlines, not boxes; honey accent < 5% of the screen.
5. **One atom kit** — same primitives byte-identical across breakpoints; mobile-first, tables become lists under `sm`.

## Accessibility & Inclusion

- Every delta pairs an arrow (▲/▼) with color — color is reinforcement, never the sole meaning.
- Tabular numerals for all money so values don't jitter.
- `prefers-reduced-motion` honored on every animation; tap targets ≥ 44px; Thai (Kanit) legibility drives the bumped type scale.
