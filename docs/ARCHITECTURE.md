# Architecture & System Design — Discord Game Alarm Bot

## 1. High-Level Concept

```text
Discord Interaction
        │
        ├── Slash Command
        ├── Button
        ├── Select Menu
        └── Modal
                │
                ▼
        Interaction Router
                │
                ▼
          Application Layer
                │
        ┌───────┼────────┐
        ▼       ▼        ▼
      Alarm   Event     Boss
        │       │        │
        └───────┼────────┘
                ▼
             Scheduler
                │
                ▼
        Notification Engine
          ┌─────┼─────┐
          ▼     ▼     ▼
         DM  Discord Voice
```

## 2. Core Modules

### 2.1. Bot & Interaction Layer
- `DiscordClient.ts`: Manages discord.js Client lifecycle, gateway events, login, and graceful shutdown.
- `CommandRegistry.ts`: Loads, registers, and syncs application slash commands with Discord REST API.
- `InteractionRouter.ts`: Routes interactions to appropriate handlers based on custom ID prefixes (`btn:`, `sel:`, `modal:`).

### 2.2. Domain Models
- `Alarm.ts`: Represents one-time quick timers, specific hour alarms, or boss respawn timers.
- `Event.ts`: Represents recurring events (daily, weekly) or guild-wide game schedule.
- `VoiceSession.ts`: Tracks active voice connections per guild/user.
- `Boss.ts`: Domain logic for boss respawn calculations and remaining time.

### 2.3. Scheduler Engine
- `AlarmScheduler.ts`:
  - Priority queue / timer loop for alarms.
  - Loads active alarms from SQLite on startup.
  - Prevents duplicate execution.
  - Cleanly handles cancellations.
- `EventScheduler.ts`:
  - Handles daily and weekly recurring events.
  - Re-computes next trigger datetime in `Asia/Ho_Chi_Minh` timezone.
  - Survives bot restarts.

### 2.4. Notification Engine
- `NotificationService.ts`: Central dispatcher for notifications.
- `DiscordNotifier.ts`: Sends styled rich embeds and user pings in guild text channels.
- `DMNotifier.ts`: Sends direct messages to users with fallback handling if DMs are closed.
- `VoiceNotifier.ts`: Plays sound alerts or TTS announcements when user is in the voice channel.

### 2.5. Persistence Layer
- SQLite database with strict schema:
  - `users`: User preferences and timezone.
  - `alarms`: Timer details, trigger timestamps, type, voice session association.
  - `events`: Recurring rules, day of week, time of day.
  - `voice_sessions`: Active and historical voice connections.
