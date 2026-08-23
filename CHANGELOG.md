# Changelog

## 0.1.25 - 2026-08-23

- Updated Week History so the current day is never shown as a red missed day while it is still in progress.
- Current-day cards now use a solid gold background with dark contrast text while incomplete, and a solid green background with white text once complete.
- Changed the current-day incomplete status from `MISSED` to `INCOMPLETE`.
- Added a `★ TODAY` marker in the lower-right of the current-day card so it remains visually distinct from historical days.
- Left past-day missed/partial/comeback styling and rolling 7-day recovery logic unchanged.

## 0.1.24 - 2026-08-23

- Changed date-of-birth entry and display to UK `DD-MM-YYYY` format while continuing to store ISO dates in Supabase.
- Added a shared up/down chevron component as the standard app convention for collapsed and expanded controls.
- Routed Stats & Measurements to a corrected POC-style screen using the shared chevrons and compact gold-outline `+ ADD` buttons modelled on the BACK control.
- Added a visible Hit My Protein entry under Secret Nerd Stuff with a persistent enable/disable switch.
- Added DOB-aware protein goal choices: adult users can choose Stay Active, Build Muscle, or Lose Fat / Keep Muscle; under-18 users instead see Stay Active, Training & Recovery, or Build Strength & Muscle, with no weight-loss goal.
- Added one-page protein goal explanations with recommended g/kg values, bounded advanced multiplier controls, and Reset to Recommended.
- Kept Hit My Protein as a calculator/reference feature only; no food logging was introduced.
- Added a separate development backlog item for QR-based friend invitations with no global user search and invite-only group membership.

## 0.1.22 - 2026-08-23

- Added date of birth as a required field when creating a new account, with basic past-date validation.
- Stored date of birth in the Supabase profile created by the auth signup trigger.
- Added a Profile & Account screen under Secret Nerd Stuff so existing users can add or correct their display name and date of birth.
- Added dormant profile fields for the optional Hit My Protein feature: enabled state, selected goal and advanced multiplier override.
- Constrained protein goals and multiplier overrides at the database layer so future calculator settings cannot store unsupported values.
- Hardened the auth profile-creation trigger by revoking direct RPC execution from public, anonymous and authenticated roles.
- Kept Hit My Protein calculations and screens out of this release so the profile/auth foundation can be tested independently.

## 0.1.21 - 2026-08-23

- Restored the queued POC parity pass after the interrupted GitHub session.
- Replaced the Today Comeback status action with the agreed purple `VIEW →` treatment and strengthened the purple Comeback card treatment.
- Aligned History Week, Month and Year calculations with the rolling 7-day Comeback window used by Today, including purple repaired states and recovered credit in summary calculations.
- Renamed the Leaders sub-tab from `LEADERBOARD` to `LEADERS` while preserving Friends, Teams, Houses and Schools views.
- Simplified the Stats weight chart by reducing date-label clutter while retaining interactive tap values.
- Enlarged the central bottom-nav Add control, Today `+ ADD TRAINING`, and Stats `+ ADD` controls for closer POC parity and easier tapping.

## 0.1.20 - 2026-08-22

- Added a shared POC exercise and activity catalogue, including the full 42-exercise bodyweight library plus the original dumbbell, kettlebell and gym starters.
- Restored the Strength Quick Start workout builder with exercise search and equipment filters, editable sets, reps/time and weights, add-set and remove-exercise controls, estimated duration, completion summary and template naming.
- Connected completed strength workouts back into the existing Supabase-backed activity history.
- Expanded Exercise Library from placeholder rows to a searchable/filterable catalogue with favourites and custom-exercise creation.
- Restored the full POC Sports & Activities catalogue and custom activity creation.
- Restored editable exercise timing, per-exercise rep pace, strength tracking, targets, core/advanced measurements and editable school term dates.
- Kept the approved POC visual language and existing rolling 7-day fire/comeback rules while moving functionality into the production Expo Router structure.

## 0.1.19 - 2026-08-22

- Replaced calendar-week Comeback locking with a rolling 7-day recovery window.
- Limited comeback allocation to today plus the previous six days, so older dates automatically lock and can never be backfilled later.
- Kept comeback allocation recent-first within the eligible seven-day window and aligned the Today fire calculation to the same rolling window.
- Updated the Comeback explainer and Today card wording to make the rolling 7-day rule explicit.

## 0.1.18 - 2026-08-22

- Standardised Secret Nerd Stuff cards to a consistent height sized for two-line titles and descriptions, while vertically centring shorter options.
- Added a larger shared gold-outline `← BACK` button and applied it across activity, workout, settings, and new secondary screens.
- Made the Weekly Comeback card on Today open a dedicated explainer screen.
- Added a Weekly Comeback breakdown showing excess minutes, comeback rate, generated comeback minutes, and the last seven days with normal, repaired, and partial recovery states.
- Corrected comeback allocation so discounted excess minutes fill the most recent missed day first, then work backwards through the current week.
- Added the 260 excess × 50% = 130 comeback-minutes POC example and clarified that repaired days affect consistency going forward without retroactive XP.

## 0.1.17 - 2026-08-22

- Fine-tuned the locked circular current-day fire marker by shifting it 2px right for optical centring.
- Corrected streak rewards so day 1 is always ×1.00 / base XP, with consistency multipliers beginning from day 2.
- Tightened the Awards cards so all six badges stay in the intended two-column grid.
- Replaced the placeholder Stats line with a scaled interactive chart with axes, grid lines, connected points, date labels, and tap-to-view values.
- Reworked Secret Nerd Stuff from the original `App.js` treatment with larger icons and text plus the original right-arrow glyph.

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

- Restored the locked bottom navigation icon set with Home, clock, podium, filled gear, and the central Add button.
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
