# Changelog

## 0.1.43 - 2026-08-23

- Added interactive Month History date states and tap-through daily activity breakdowns.
- Changed Year History percentages to score only days actually available since signup and up to today in the current month.

## 0.1.42 - 2026-08-23

- Reworked friend-code entry into a six-slot auto-submit flow and fixed friend-code generation failing on an ambiguous expiry reference.
- Standardised primary action buttons to keep labels on one line.

## 0.1.41 - 2026-08-23

- Added private mutual friendships using single-use six-digit codes that expire after five minutes, with no global user search and two-way removal.

## 0.1.40 - 2026-08-23

- Added persistent Sports & Activities management with user-created activity editing and per-user Hide / Show controls that preserve historical logs.

## 0.1.39 - 2026-08-23

- Added per-exercise `SETS | HOW TO` views in the Workout screen, reusing Exercise Library illustrations and technique guidance with optional video links when available.

## 0.1.38 - 2026-08-23

- Unified the Strength Training exercise picker with the main Exercise Library, including RepDB images, favourites, horizontal filters and `MY EQUIPMENT`.
- Added per-user exercise measurement settings for Time, Reps, Weight and Distance and made workout set fields follow those settings.
- Added persistent custom strength exercises that use the same measurement and equipment model.

## 0.1.37 - 2026-08-23

- Reworked History Week corrections into a dedicated edit flow with preloaded activity values, quick-duration changes and update-in-place database saves.
- Moved activity removal into edit mode so destructive removal is only shown for existing records.

## 0.1.36 - 2026-08-23

- Added editable History Week records so users can add missed training or remove incorrect entries from past days.
- Preserved the selected History date through Sport / Activity and Strength Training so corrections are stored against the intended day.
- Added half-minute precision to Comeback Minutes displays.

## 0.1.35 - 2026-08-23

- Added age-gated school linking for users aged 13–19, with subscribed-school selection, read-only school calendars and school-driven Term Time / Holiday status.
- Added Sherborne School and Marlborough College as initial subscribed schools and added the school-admin calendar editor to the development backlog.
- Added the Exercise Library `MY EQUIPMENT` filter using each user's saved equipment preferences.
- Fixed exercise favourite persistence, restored activity removal from Today, corrected Comeback Minutes to use live activity data, and made the Year target line render reliably on iPhone.

## 0.1.34 - 2026-08-23

- Restored the POC Strength Exercise Library with RepDB illustrations, swipeable exercise positions and technique details.
- Added persistent per-user exercise favourites with a dedicated Favourites filter.
- Added persistent per-user equipment availability settings with owner-only Row Level Security.
- Restored the single-row horizontally scrollable equipment/favourites filter experience.

## 0.1.33 - 2026-08-23

- Added one-tap 15, 30, 45, 60, 75 and 90 minute choices to Log Activity; choosing a quick duration saves immediately and returns to Home.
- Kept manual duration entry available with an inline `LOG ACTIVITY` action and removed the Training Credit panel.
- Added a shared `PrimaryActionButton` for primary gold actions.
- Corrected the shared CardAction component location so the Expo alias resolves correctly.

## 0.1.32 - 2026-08-23

- Standardised card-level `VIEW →` actions as a reusable `CardAction` component.

## 0.1.31 - 2026-08-23

- Restored the dotted 80% target line on the History Year chart.
- Disabled forward navigation once History Week, Month or Year reaches the current period.
- Kept the existing account-open-date lower bound.

## 0.1.30 - 2026-08-23

- Updated the Hit My Protein selected-goal and Home target presentation.

## 0.1.29 - 2026-08-23

- Added visibility of user-overridden protein multipliers.

## 0.1.28 - 2026-08-23

- Corrected Hit My Protein Home-card routing for missing weight and goal states.

## 0.1.27 - 2026-08-23

- Restored the POC info-blue treatment for the current History day and rebuilt Month alignment against the POC reference.
- Limited History navigation to the user's account-open date and excluded pre-account dates from scoring.
- Added development backlog issue #3 for signup email confirmation and preservation of the eventual activation timestamp.

## 0.1.26 - 2026-08-23

- Restored the tap-through Progress / Levels screen behind the Home level card.
- Added the Hit My Protein Home card and persistent current weight storage used by its calculation.
- Added the supplied Progress / Levels screenshots to the project reference library.

## 0.1.25 - 2026-08-23

- Updated Week History so the current day uses a dedicated TODAY state rather than being marked missed while still in progress.

## 0.1.24 - 2026-08-23

- Added UK date-of-birth handling, the standard expand/collapse chevron convention, and the initial Hit My Protein configuration flow.
- Added a separate development backlog item for QR-based friend invitations with no global user search and invite-only group membership.

## 0.1.22 - 2026-08-23

- Added date of birth as a required signup/profile field and added dormant Hit My Protein preference fields.
- Hardened the auth profile-creation trigger by revoking direct RPC execution from public, anonymous and authenticated roles.

## 0.1.21 - 2026-08-23

- Restored the queued POC parity pass after the interrupted GitHub session.
- Aligned History with the rolling 7-day Comeback window and updated Leaders/Stats/Add controls.

## 0.1.20 - 2026-08-22

- Added the shared POC exercise/activity catalogue and restored the Strength Quick Start workout builder.
- Expanded Exercise Library, Sports & Activities and configuration screens while preserving POC visual language.

## 0.1.19 - 2026-08-22

- Replaced calendar-week Comeback locking with a rolling 7-day recovery window.

## 0.1.18 - 2026-08-22

- Standardised Secret Nerd Stuff cards and BACK controls.
- Added the Weekly Comeback explainer and rolling recovery breakdown.

## 0.1.17 - 2026-08-22

- Corrected streak rewards and refined the fire marker, Awards cards, Stats chart and Secret Nerd Stuff treatment.

## 0.1.16 - 2026-08-22

- Reworked History, Leaders and Secret Nerd Stuff against the uploaded POC/screenshots and restored the SCHOOL - SPORTS - AWARDS strapline.

## 0.1.15 - 2026-08-22

- Ported the Today styling directly from the uploaded Snack `App.js`, restoring the approved level card, typography, ring and fire treatment.

## 0.1.14 - 2026-08-22

- Restored the Today target card structure and Weekly Comeback calculation.
- Seeded the Supabase activity library and added persistent activity favourites and target-aware logging.

## 0.1.13 - 2026-08-22

- Rebuilt Today, History, Add Training, Leaders and Secret Nerd Stuff around the approved POC hierarchy while preserving Supabase-backed data.

## 0.1.12 - 2026-08-22

- Re-established the uploaded POC `App.js` and screenshots as the visual source of truth for the full application.
- Restored the approved product name, bottom navigation and broader optional-organisation scope.

## 0.1.11 - 2026-08-22

- Restored the Today screen to a fixed-height app layout with anchored bottom navigation.

## 0.1.10 - 2026-08-22

- Restored the locked bottom navigation icon set, product name and segmented progress ring behaviour.

## 0.1.9 - 2026-08-22

- Pinned Expo SDK 54 router dependencies for Expo Go compatibility.

## 0.1.8 - 2026-08-22

- Removed the stale `expo-dev-client` app plugin so Expo Go can start after the SDK 54 downgrade.

## 0.1.7 - 2026-08-22

- Downgraded the Expo runtime to SDK 54 for Expo Go compatibility on physical iPhones.
- Added an Expo Go tunnel command for QR-code device preview.

## 0.1.6 - 2026-08-22

- Restored the Today home screen to the dark navy and gold training design.

## 0.1.5 - 2026-08-22

- Fixed Supabase table grants so authenticated users can save and read their activity logs.

## 0.1.4 - 2026-08-22

- Added persistent activity logging to Supabase and History backed by each signed-in user's activity logs.

## 0.1.3 - 2026-08-22

- Applied the initial Supabase production schema with profiles, organisations, memberships, activities, activity logs, auth profile creation, and Row Level Security.

## 0.1.2 - 2026-08-22

- Fixed the Codespaces phone web preview command to use Expo's supported LAN host mode.

## 0.1.1 - 2026-08-22

- Added a fast Codespaces-to-iPhone web preview command and Expo development-client support.

## 0.1.0 - 2026-08-22

- Created the Expo + TypeScript + Expo Router production foundation.
- Added Supabase client configuration, persistent auth, initial schema, shared theme/components and EAS build profiles.
