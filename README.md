# I Can't Hit My Protein

A cross-platform training and fitness app for individual users, with optional social and organisational features for schools, workplaces, clubs, gyms, universities, and other communities.

## Product goals

- Log sport, cardio, strength, recovery, PE, and other activities.
- Track progress, awards, workouts, and private measurements.
- Support optional organisations and groups for leaderboards, programmes, and challenges.
- Allow coaches and organisation admins to assign programmes without exposing private body measurements.
- Run on web, iPhone, and Android from one Expo codebase.

## Architecture

- Expo SDK 57 + React Native + Expo Router
- TypeScript
- Supabase Auth + PostgreSQL + Row Level Security
- Feature-based source structure

## Roles

- `user` — personal training and social features
- `coach` — programme and group management within an organisation
- `organisation_admin` — organisation configuration and membership management
- `platform_admin` — platform-wide administration

Organisation membership is optional. A user can use the app fully without joining a school, workplace, club, or other organisation.

## Codespaces setup

1. Open the repository in GitHub Codespaces.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Add the Supabase project URL and publishable key.
5. Run `npm run start`.

## iPhone preview

Install Expo Go on the iPhone. In the Codespace run `npx expo start --tunnel`, then scan the Expo QR code with the iPhone camera / Expo Go. Expo SDK 57 supports Expo Router and Expo Go. We can move to an EAS development build later when native capabilities require it.

## Security

Never commit Supabase service-role keys, database passwords, or other secrets. Client-facing Supabase access is protected with Row Level Security.
