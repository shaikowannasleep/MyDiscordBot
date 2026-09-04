import { Client, Colors } from 'discord.js';
import { DiscordNotifier } from './DiscordNotifier';
import { DMNotifier } from './DMNotifier';
import { VoiceNotifier } from './VoiceNotifier';
import { NotificationType } from '../domain/Alarm';

export interface AlertPayload {
  userId: string;
  guildId?: string;
  channelId?: string;
  title: string;
  message: string;
  notificationType: NotificationType;
  mentionTag?: string;
  color?: number;
  singleAlert?: boolean;
}

export class NotificationService {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async dispatchAlert(payload: AlertPayload): Promise<void> {
    const { userId, guildId, channelId, title, message, notificationType, mentionTag, singleAlert } = payload;
    const color = payload.color || Colors.Gold;

    // 1. Channel Notification
    if ((notificationType === 'channel' || notificationType === 'all') && channelId) {
      await DiscordNotifier.sendChannelAlert(this.client, channelId, userId, title, message, color, mentionTag, singleAlert);
    }

    // 2. Direct Message Notification
    // Luôn gửi kèm DM cho chủ nhân hẹn giờ để điện thoại chắc chắn reo chuông / nổ popup (kể cả khi tắt chuông server)
    if (notificationType === 'dm' || notificationType === 'all' || (notificationType === 'channel' && userId)) {
      const dmSent = await DMNotifier.sendDMAlert(this.client, userId, title, message, color);
      // Fallback: If DM was requested but user has DMs disabled, try channel if available
      if (!dmSent && channelId && notificationType === 'dm') {
        await DiscordNotifier.sendChannelAlert(this.client, channelId, userId, title, message, color, mentionTag, singleAlert);
      }
    }

    // 3. Voice Notification
    if ((notificationType === 'voice' || notificationType === 'all') && guildId) {
      await VoiceNotifier.playVoiceAlert(guildId);
      // If voice-only, also send a quiet fallback text in channel if available
      if (notificationType === 'voice' && channelId) {
        await DiscordNotifier.sendChannelAlert(this.client, channelId, userId, `🔊 ${title}`, message, color);
      }
    }
  }
}
