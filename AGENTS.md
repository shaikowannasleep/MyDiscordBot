# AGENTS.md

## Project

Discord Game Alarm Bot.

## Rules

1. Read README.md before modifying code.
2. Read docs/ARCHITECTURE.md before changing architecture.
3. Study Hoyo Buddy UX patterns but never copy source code.
4. Keep business logic outside Discord command handlers.
5. Use TypeScript strict mode.
6. Every feature requires tests.
7. Persistent events must survive bot restart.
8. Temporary voice alarms belong to VoiceSession.
9. /exit must never delete persistent events.
10. All time calculations use Asia/Ho_Chi_Minh by default.
11. Never commit secrets.
12. Never introduce unnecessary dependencies.
13. Prefer Discord native interaction components.
14. Prefer buttons/selects/modals over complicated commands.
15. Maintain backward compatibility for existing commands.
16. Run lint, typecheck and tests before considering a task complete.
