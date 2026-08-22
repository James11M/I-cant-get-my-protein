# Changelog

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
