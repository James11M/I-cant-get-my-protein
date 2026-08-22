# I CAN'T HIT MY PROTEIN — Project Toolkit & Build Story

This document is a living record of the tools, platforms, architectural choices, and AI-assisted workflow used to build **I CAN'T HIT MY PROTEIN** from scratch.

The purpose is to support a future school presentation showing how a real-world app can be designed, prototyped, engineered, tested, and prepared for release using ChatGPT as the main development partner.

## 1. ChatGPT — product design, coding and iteration

ChatGPT has been used as the central AI development partner across the project. It has helped with:

- turning an initial idea into product requirements;
- designing the user experience and screen structure;
- generating and refining React Native code;
- translating prototype ideas into a maintainable full application;
- planning the data model and Supabase backend;
- connecting work to GitHub;
- debugging Expo, dependency, and SDK issues;
- documenting changes through README and CHANGELOG files;
- iterating rapidly from screenshots and natural-language prompts.

The important lesson is that the user still provides direction, taste, constraints, testing feedback, and product decisions. AI accelerates the implementation loop.

## 2. Expo Snack — the proof of concept

**Expo Snack** was used at the beginning because it allowed the app to be created and tested in a browser with minimal setup.

Why it was useful:

- no local development environment was required;
- a single `App.js` file could be copied and pasted;
- visual ideas could be tested quickly;
- the app could be previewed on a phone;
- rapid prompting made it possible to experiment with gamification, history views, workout flows, progress rings, leaderboards and settings before committing to full architecture.

Snack was ideal for the POC, but a single large `App.js` eventually became too difficult to scale safely. That was the trigger to move to a full application structure.

## 3. Expo + React Native — the production app

The full application uses **Expo + React Native + TypeScript**.

Why:

- one codebase can target iPhone, Android and web;
- React Native provides native-feeling mobile interfaces;
- Expo simplifies device testing and build tooling;
- TypeScript improves maintainability as the project becomes larger;
- Expo Router gives the project real application routes instead of one large prototype file.

Current runtime target: **Expo SDK 54**, chosen to maintain Expo Go compatibility for easy iPhone preview during development.

## 4. GitHub — source control and project history

GitHub stores the full source code and preserves the development history.

Repository:

`James11M/I-cant-get-my-protein`

GitHub is used for:

- source control;
- committing changes directly from ChatGPT;
- tracking app versions;
- maintaining `README.md` and `CHANGELOG.md`;
- recovering earlier versions if something breaks;
- making the development process visible and auditable.

## 5. GitHub Codespaces — cloud development environment

**Codespaces** provides a browser-based development machine.

Why it matters for this project:

- no powerful local development computer is required;
- the full project can be opened from a browser;
- terminal commands such as `npm install`, `git pull`, and `npm run phone:go` can be run in the cloud;
- it works well with school or restricted devices where local installation may be difficult;
- it allows the project to move from Snack to a professional development structure without losing the accessible workflow.

## 6. Supabase — backend, authentication and database

**Supabase** provides the production backend.

Current responsibilities include:

- user authentication;
- user profiles;
- optional organisations such as schools, workplaces, clubs, gyms and universities;
- memberships and roles;
- activity logging;
- persistent training history;
- PostgreSQL database storage;
- Row Level Security so users only see data they are permitted to access.

The architecture deliberately allows a person to use the app without belonging to a school or organisation.

## 7. PostgreSQL — structured app data

Supabase uses PostgreSQL underneath.

The data model is intended to support:

- users and profiles;
- organisations;
- groups, houses and teams;
- activities and sports;
- completed activity logs;
- workouts and exercises;
- XP and streak calculations;
- awards and achievements;
- leaderboards;
- measurements and personal statistics;
- configurable targets;
- optional school or workplace calendars.

## 8. Expo Go — rapid phone testing

Expo Go provides the quickest way to view the current app on an iPhone during development.

Typical workflow:

```bash
git pull
npm install
npm run phone:go
```

A QR code is then scanned on the phone.

This creates a very short loop between:

**Prompt → Code → GitHub → Codespaces → Expo Go → Feedback → Next prompt**

## 9. AI-driven rapid iteration

A major theme of the project is iteration speed.

Example workflow:

1. View a screen on the phone.
2. Decide what does not feel right.
3. Describe the change to ChatGPT in normal language.
4. ChatGPT inspects the existing implementation and reference POC.
5. Code is changed and committed to GitHub.
6. Pull the change in Codespaces.
7. Reload in Expo Go.
8. Compare the result and repeat.

The POC screenshots and original `App.js` are now treated as the visual source of truth so AI changes do not unintentionally redesign previously approved screens.

## 10. Product features being developed

### Gamification

- XP levels;
- progress toward the next level;
- streak / fire score;
- comeback mechanics;
- badges and achievements;
- long-term progression.

### Training

- sport and activity logging;
- strength workouts;
- exercise library;
- custom exercises and sports;
- templates and quick-start workouts;
- weekly, monthly and yearly history.

### Social and competition

- friends;
- teams;
- leaderboards;
- school houses;
- sports teams;
- workplace groups;
- organisation challenges.

### Tracking

- weight and height;
- strength tracking;
- best 10-rep weight;
- charts and long-term trends;
- optional advanced measurements.

### Optional organisation integration

- schools;
- workplaces;
- clubs;
- gyms;
- universities;
- coaches and admins;
- programmes and challenges.

## 11. Release path

The project is being built toward a real distribution path:

1. Prototype in Snack.
2. Build full React Native app.
3. Add Supabase persistence and authentication.
4. Test on real iPhone using Expo Go.
5. Improve stability and polish.
6. Produce signed production builds with Expo Application Services (EAS).
7. Prepare screenshots, privacy information and app-store metadata.
8. Submit to the Apple App Store and Google Play.
9. Test real adoption with users.
10. Improve retention based on feedback and usage.

## 12. The school presentation story

A future presentation should show the journey rather than only the final product.

Suggested narrative:

1. **Concept** — the original problem and idea.
2. **First prompts** — how a conversation became product requirements.
3. **POC** — using Snack and one `App.js` file to make the idea tangible.
4. **Tools** — how AI selected and connected professional development tools.
5. **From prototype to architecture** — why the project moved to React Native, TypeScript, GitHub and Supabase.
6. **Fast iteration** — screenshot → prompt → improved screen.
7. **Features** — gamification, streaks, tracking, leaderboards and optional organisation integration.
8. **Backend** — authentication, PostgreSQL, Supabase and security.
9. **Release** — how software reaches the App Store and Google Play.
10. **Next steps** — adoption, retention, user feedback and future AI features.

## 13. Assets to capture as the project develops

Keep examples of:

- early prompts;
- the first working Snack screen;
- the large original `App.js` POC;
- before/after screen comparisons;
- GitHub commit history;
- Codespaces terminal output;
- Expo Go QR preview;
- Supabase table / schema views;
- database architecture diagram;
- finished app screens;
- App Store / Google Play submission screens when reached.

These will make the final school presentation much stronger because they demonstrate the actual development journey.

---

**Living document:** continue adding tools, architectural changes, important prompts, screenshots, mistakes, debugging stories and release milestones as the project develops.
