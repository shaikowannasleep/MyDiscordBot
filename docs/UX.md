# UX Guidelines — Hoyo Buddy Inspired Interaction Flow

## 1. Principles
- **Instant Discovery**: Users in game shouldn't memorize complicated command flags. The `/alarm` dashboard provides visual one-click options.
- **Rich Embeds & Visual Hierarchy**: Color-coded banners (Green for success, Blue for schedule, Gold for Boss timers, Red for warnings/confirmation).
- **Interactive Modals**: Form inputs for event names, times, and notification preferences use Discord Modals instead of long argument strings.
- **Safety Confirmations**: Destructive actions like `/cancelall` or single alarm deletions present confirmation buttons before committing changes.
- **Context-Aware Voice State**: The bot only enters Voice Alarm Mode if the calling user is actively inside an accessible voice channel.
- **Graceful Lifecycle**: `/exit` cleans up temporary session timers while preserving guild-wide or user recurring events.
