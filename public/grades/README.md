# Grade company logos

Drop the **official** grading-company logo files here and `GradeLogo`
(`src/components/cards/card-detail/grade-logo.tsx`) picks them up automatically —
no code change needed (same pattern as `/public/sources/`).

Expected filenames (PNG or transparent, ~square, ≥32px):

| file       | company        |
| ---------- | -------------- |
| `psa.png`  | PSA            |
| `bgs.png`  | Beckett (BGS)  |
| `cgc.png`  | CGC            |

Use each company's **official asset** (nominative use to label their grade).
Until a file exists, the chip falls back to a neutral shield icon — nothing breaks.
