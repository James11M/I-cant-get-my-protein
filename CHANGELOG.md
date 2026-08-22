# Changelog

## 0.1.16 - 2026-08-22

- Locked the preferred circular current-day marker around the Today fire icon.
- Reworked History Week, Month, and Year views to follow the uploaded Snack POC and screenshots more closely while keeping Supabase-backed activity data.
- Restored History period navigation, coloured day states, month score/calendar layout, year bars, and comeback cues.
- Reworked Leaders to match the POC Leaderboard, Awards, and Stats screens, including Friends, Teams, Houses, and Schools tabs and the JAMES • YOU row treatment.
- Reworked Secret Nerd Stuff to match the POC menu card sizing, gold borders, icons, typography, descriptions, and spacing.
- Restored the POC strapline SCHOOL - SPORTS - AWARDS.

## 0.1.15 - 2026-08-22

- Ported the Today screen styling directly from the uploaded Snack `App.js` instead of reinterpreting the approved POC.
- Restored the gold Level card border, original typography, gold level circle text, blue Today target border, and white section headings.
- Restored the exact 80px / 24-segment POC progress ring with 5x11 ticks and percentage-only centre text.
- Restored the orange consistency multiplier and fire count, plus the original flame sizing and current-day underline treatment.
- Restored the missing POC blue, orange, purple, and yellow theme accents.

## 0.1.14 - 2026-08-22

- Restored the Today target card to the Snack POC structure: compact target ring, separate progress bar, and a full-width XP / consistency multiplier panel.
- Reduced the progress ring from 160px to 120px so it remains below half the target card width on iPhone layouts.
- Restored the original Weekly Comeback calculation, including 50% recovery from credit earned above the daily target.
- Seeded the Supabase activity library with the 15 POC system activities and their measurement types, targets, default durations and icons.
- Added per-user activity favourites with Row Level Security.
- Replaced the temporary free-text activity logger with the database-driven POC activity library, filters and favourite controls.
- Added target-aware activity logging so time, distance and holes calculate raw credit using the POC rules, while recovery activities remain non-credit activity.
- Preserved raw credit above 30 minutes in activity logs so Weekly Comeback can work correctly.

## 0.1.13 - 2026-08-22

- Rebuilt Today to follow the uploaded POC hierarchy: level, target ring, XP reward, fire score, capacity, activity and weekly comeback.
- Rebuilt History with POC Week, Month and Year views while preserving real Supabase activity-log data.
- Rebuilt Add Training with Sport / Activity and Strength Training choices, plus POC-style activity entry, Strength Quick Start and initial Workout screens.
- Added Leaders with Leaderboard, Awards and Stats tabs in the approved POC visual system.
- Added Secret Nerd Stuff and POC-style Exercise Library, Sports & Activities, Exercise Timing, Strength Tracking, Targets, Stats & Measurements and School Term Dates screens.
- Updated the visible strapline from SCHOOL - SPORTS - AWARDS to SCHOOL - SPORTS - PROGRESS.
- Restored the complete POC navy/gold palette including the locked card3/ring-track colour.
- Wired all five locked bottom-navigation destinations to live Expo Router routes.

## 0.1.12 - 2026-08-22

- Re-established the uploaded POC `App.js` and screenshots as the visual source of truth for the full application.
- Restored the approved product name to I Can't Hit My Protein.
- Restored the locked POC bottom navigation treatment, including gold active states and the custom Home, clock, podium, gear, and central Add icons.
- Preserved the broader product scope: individual use is primary and school, workplace, club, gym, university, and other organisation membership remains optional.

## 0.1.11 - 2026-08-22

- Restored the Today screen to a fixed-height app layout so the main experience fits the iPhone viewport without page-style scrolling.
- Kept the locked bottom navigation anchored at the bottom of the screen.
- Compacted the Today progress ring, stat cards, and activity action while preserving the locked colours and ring behaviour.

## 0.1.10 - 2026-08-22

- Restored the locked bottom navigation icon set with Home, clock, podium, filled gear, and the central gold Add button.
- Restored the product name to I Can't Get My Protein.
- Restored the locked segmented progress ring behaviour across 0–300% while preserving the locked ring track colour.
- Pinned Expo Go-compatible vector icon and font dependencies for SDK 54.

## 0.1.9 - 2026-08-22

- Pinned Expo SDK 54 router dependencies for Expo Go compatibility, including `react-native-screens` 4.16.
- Added the Expo Router native support packages required by SDK 54.

## 0.1.8 - 2026-08-22

- Removed the stale `expo-dev-client` app plugin so Expo Go can start after the SDK 54 downgrade.

## 0.1.7 - 2026-08-22

- Downgraded the Expo runtime to SDK 54 for Expo Go compatibility on physical iPhones.
- Aligned React Native, React, Expo Router, Expo SQLite, and React type versions with SDK 54.
- Added an Expo Go tunnel command for QR-code device preview.
- Removed the development-client dependency from the default preview path.

## 0.1.6 - 2026-08-22

- Restored the Today home screen to the dark navy and gold training design.
- Added the segmented daily progress ring using the locked ring track colour.
- Added Today stats, quick activity action, History link, and bottom navigation styling.

## 0.1.5 - 2026-08-22

- Fixed Supabase table grants so authenticated users can save and read their activity logs.

## 0.1.4 - 2026-08-22

- Added persistent activity logging to Supabase.
- Added History backed by each signed-in user's activity logs.
- Added Today navigation into Add Activity and History.

## 0.1.3 - 2026-08-22

- Applied the initial Supabase production schema with profiles, organisations, memberships, activities, activity logs, auth profile creation, and Row Level Security.

## 0.1.2 - 2026-08-22

- Fixed the Codespaces phone web preview command to use Expo's supported LAN host mode.

## 0.1.1 - 2026-08-22

- Added a fast Codespaces-to-iPhone web preview command.
- Added Expo development-client support for native iPhone testing.
- Updated iPhone preview guidance for Expo SDK 57.

## 0.1.0 - 2026-08-22

- Created the Expo SDK 57 + TypeScript + Expo Router production foundation.
- Added Supabase client configuration and persistent auth session support.
- Added login, signup, protected app routing, and initial signed-in Today screen.
- Added the first Supabase migration for users, optional organisations, activities, activity logs, and Row Level Security.
- Added shared theme, brand, card, and screen components while preserving the existing app branding.
- Added EAS build profiles, environment template, README, repository ignores, and iPhone preview instructions.
