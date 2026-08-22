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

### Fastest preview

Run `npm run phone:web` in Codespaces. Make the forwarded web port public, then open the forwarded URL in Safari on the iPhone. This gives a quick phone-sized preview without an Apple Developer account.

### Native development build

The production project uses Expo SDK 57, so native device testing uses an Expo development build rather than Expo Go during the SDK 57 transition.

The repository includes `expo-dev-client` and an EAS development profile. Creating an iOS development build with EAS requires Apple signing credentials.

Once the development build is installed, run `npm run phone:native` to connect it to the Codespaces development server.

## Security

Never commit Supabase service-role keys, database passwords, or other secrets. Client-facing Supabase access is protected with Row Level Security.
