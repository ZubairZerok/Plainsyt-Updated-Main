# Plainsyt Project Guidelines & Rules

## Typography Rule: Hind Siliguri for Numbers
- **Font:** Hind Siliguri (`"Hind Siliguri", "Inter", sans-serif`) is the primary font across Plainsyt.
- **Normal Text:** Regular reading text, body paragraphs, and labels should use normal/standard font weight (`font-normal`, `font-medium`, 400–500).
- **Numbers & Numerals (Strict Rule):**
  - **Always use the Bold 700 version of Hind Siliguri** for any number (both Bengali digits `০, ১, ২, ৩, ৪, ৫, ৬, ৭, ৮, ৯` and Latin digits `0, 1, 2, 3, 4, 5, 6, 7, 8, 9`).
  - This applies to all statistics, view counts, reaction counts, dates, timestamps, order amounts, prices (BDT ৳), metrics, page numbers, and inline numbers in text.
  - In CSS (`src/styles/fonts.css`), an automated `@font-face` rule maps `unicode-range: U+0030-0039, U+09E6-09EF` to Hind Siliguri weight 700 across normal weights (100–600) so that digits automatically render in Bold 700 even inside standard text blocks.
  - When explicitly formatting standalone numeric badges, counters, or metrics in React/Tailwind, explicitly apply `font-bold` (700) or ensure Hind Siliguri 700 is active.

