import { NotificationService } from '../notification/NotificationService';
import { AlarmRepository } from '../database/repositories/AlarmRepository';
import { Alarm } from '../domain/Alarm';
import { Colors } from 'discord.js';

export class AlarmScheduler {
  private notificationService: NotificationService;
  private checkInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
  }

  public start(): void {
    if (this.checkInterval) return;

    console.log('[AlarmScheduler] Starting alarm scheduler background loop (1s resolution)...');
    // Check every 1 second for precision
    this.checkInterval = setInterval(() => this.processPendingAlarms(), 1000);

    // Initial pass immediately
    this.processPendingAlarms();
  }

  public stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async processPendingAlarms(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const now = Date.now();
      const activeAlarms = AlarmRepository.findActiveAll();

      for (const alarm of activeAlarms) {
        if (alarm.triggerAt <= now) {
          await this.triggerAlarm(alarm);
        }
      }
    } catch (error) {
      console.error('[AlarmScheduler] Error in processPendingAlarms loop:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async triggerAlarm(alarm: Alarm): Promise<void> {
    if (!alarm.id) return;

    // Immediately disable in DB to prevent duplicate triggers on lag/restart
    AlarmRepository.disable(alarm.id);

    let titlePrefix = '⏰ ALARM';
    let color: number = Colors.Gold;

    if (alarm.type === 'boss') {
      titlePrefix = '🔔 BOSS SPAWN';
      color = Colors.Red;
    }

    const message = alarm.type === 'boss'
      ? `🐉 **${alarm.title}**\nĐã đến giờ săn Boss!`
      : `⏰ **${alarm.title}**\nThời gian hẹn giờ của bạn đã đến!`;

    await this.notificationService.dispatchAlert({
      userId: alarm.userId,
      guildId: alarm.guildId,
      channelId: alarm.channelId,
      title: `${titlePrefix}: ${alarm.title}`,
      message,
      notificationType: alarm.notificationType,
      color
    });
  }
}
