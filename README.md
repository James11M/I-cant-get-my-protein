# I Can't Get My Protein

A cross-platform training and fitness app for individual users, with optional social and organisational features for schools, workplaces, clubs, gyms, universities, and other communities.

## Product goals

- Log sport, cardio, strength, recovery, PE, and other activities.
- Track progress, awards, workouts, and private measurements.
- Support optional organisations and groups for leaderboards, programmes, and challenges.
- Allow coaches and organisation admins to assign programmes without exposing private body measurements.
- Run on web, iPhone, and Android from one Expo codebase.

## Architecture

- Expo + React Native + Expo Router
- TypeScript
- Supabase Auth + PostgreSQL + Row Level Security
- Feature-based source structure

## Roles

- `user` — personal training and social features
- `coach` — programme and group management within an organisation
- `organisation_admin` — organisation configuration and membership management
- `platform_admin` — platform-wide administration

Organisation membership is optional. A user can use the app fully without joining a school, workplace, club, or other organisation.

## Local / Codespaces setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Add the Supabase project URL and publishable key.
4. Run `npm run start`.

## iPhone preview

For the current Expo SDK 57 codebase, the reliable physical-iPhone path is an Expo development build / EAS Build. During the SDK 57 transition, Expo Go on physical devices may still require an SDK 54 project, so this production project will target SDK 57 and use EAS when we begin phone testing.

## Security

Never commit Supabase service-role keys, database passwords, or other secrets. Client-facing Supabase access is protected with Row Level Security.
