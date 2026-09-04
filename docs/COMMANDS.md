# Supported Commands — Discord Game Alarm Bot

## 1. Slash Commands Overview

| Command | Arguments | Description | Example |
|---|---|---|---|
| `/alarm` | *None* | Opens the Game Alarm Dashboard with interactive buttons | `/alarm` |
| `/set` | `<duration> [title]` | Sets a quick timer (seconds, minutes, hours) | `/set 20m World Boss` |
| `/sethour` | `<time> [title]` | Sets an alarm for a specific hour today or tomorrow | `/sethour 09:00 Meeting` |
| `/event` | `[subcommand]` | Event management dashboard or creation | `/event` |
| `/event create` | *None* | Opens interactive Modal to configure a recurring event | `/event create` |
| `/boss` | `<duration> [name]` | Starts a boss respawn countdown timer with live dashboard | `/boss 30m World Boss` |
| `/list` | *None* | Displays active alarms & events with pagination & delete buttons | `/list` |
| `/cancel` | `<id>` | Cancels a specific alarm by ID with confirmation | `/cancel 12` |
| `/cancelall` | *None* | Cancels all temporary alarms with confirmation dialog | `/cancelall` |
| `/alarm join` | *None* | Connects bot to user's current voice channel | `/alarm join` |
| `/exit` | *None* | Disconnects voice, cancels session temporary alarms, keeps persistent events | `/exit` |

## 2. Supported Formats

- Duration formats for `/set` and `/boss`:
  - `20s`: 20 seconds
  - `15m`: 15 minutes
  - `1h`: 1 hour
  - `2h30m`: 2 hours and 30 minutes
- Time formats for `/sethour` and `/event`:
  - `HH:mm` (24-hour clock, e.g. `09:00`, `19:04`, `23:30`)
- Days for weekly events:
  - `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`, `sunday` (or 3-letter abbreviations: `mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun`).
