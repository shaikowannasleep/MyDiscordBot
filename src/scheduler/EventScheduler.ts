import { NotificationService } from '../notification/NotificationService';
import { EventRepository } from '../database/repositories/EventRepository';
import { GameEvent } from '../domain/Event';
import { DateUtils } from '../utils/DateUtils';
import { TimeParser } from '../utils/TimeParser';
import { Colors } from 'discord.js';

export class EventScheduler {
  private notificationService: NotificationService;
  private checkInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
  }

  public start(): void {
    if (this.checkInterval) return;

    console.log('[EventScheduler] Starting recurring events scheduler loop (5s resolution)...');
    // Check every 5 seconds
    this.checkInterval = setInterval(() => this.processPendingEvents(), 5000);

    // Initial check
    this.processPendingEvents();
  }

  public stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async processPendingEvents(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const now = Date.now();
      const activeEvents = EventRepository.findActiveAll();

      for (const event of activeEvents) {
        if (event.nextTriggerAt <= now) {
          await this.triggerEvent(event);
        }
      }
    } catch (error) {
      console.error('[EventScheduler] Error processing events:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async triggerEvent(event: GameEvent): Promise<void> {
    if (!event.id) return;

    const timeParsed = TimeParser.parseTimeOfDay(event.time);
    if (!timeParsed) return;

    // Calculate next trigger timestamp to reschedule
    let nextTriggerMs = 0;
    if (event.repeatType === 'daily') {
      const { nextDateTime } = DateUtils.getNextDailyTrigger(timeParsed.hour, timeParsed.minute);
      nextTriggerMs = nextDateTime.toMillis();
    } else if (event.repeatType === 'weekly' && event.dayOfWeek) {
      const nextDt = DateUtils.getNextWeeklyTrigger(event.dayOfWeek, timeParsed.hour, timeParsed.minute);
      nextTriggerMs = nextDt.toMillis();
    }

    // Reschedule in database
    if (nextTriggerMs > 0) {
      EventRepository.updateNextTrigger(event.id, nextTriggerMs);
    }

    // Dispatch Notification
    const repeatLabel = event.repeatType === 'weekly'
      ? `Mỗi ${TimeParser.getDayName(event.dayOfWeek || 1)}`
      : 'Hàng ngày';

    const message = `⚔️ **${event.name}**\nSự kiện bắt đầu lúc **${event.time}** (${repeatLabel}).`;

    await this.notificationService.dispatchAlert({
      userId: event.userId,
      guildId: event.guildId,
      channelId: event.channelId,
      title: `⚔️ GAME EVENT: ${event.name}`,
      message,
      notificationType: event.notificationType as any,
      color: Colors.Purple
    });
  }
}
