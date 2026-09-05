import { Client, Colors } from 'discord.js';
import { DiscordNotifier } from './DiscordNotifier';
import { DMNotifier } from './DMNotifier';
import { DMBuzzerManager } from './DMBuzzerManager';
import { VoiceNotifier } from './VoiceNotifier';
import { NotificationType } from '../domain/Alarm';
import { TelegramBotClient } from '../telegram/TelegramBotClient';

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
  private client: Client | null;

  constructor(client?: Client | null) {
    this.client = client || null;
  }

  public async dispatchAlert(payload: AlertPayload): Promise<void> {
    const { userId, guildId, channelId, title, message, notificationType, mentionTag, singleAlert } = payload;
    const color = payload.color || Colors.Gold;

    // 1. Channel Notification
    if ((notificationType === 'channel' || notificationType === 'all') && channelId && this.client) {
      await DiscordNotifier.sendChannelAlert(this.client, channelId, userId, title, message, color, mentionTag, singleAlert);
    }

    // 2. Direct Message Notification
    // Bắn DM cho user cho đến khi user bấm ĐÃ ĐỌC hoặc nhắn tin thì mới thôi
    if (userId.startsWith('tg:')) {
      const tgChatId = userId.replace('tg:', '');
      await TelegramBotClient.dispatchTelegramAlert(tgChatId, title, message, singleAlert);
    } else if (notificationType === 'dm' || notificationType === 'all' || (notificationType === 'channel' && userId)) {
      let dmSent = false;
      if (this.client) {
        if (singleAlert) {
          dmSent = await DMNotifier.sendDMAlert(this.client, userId, title, message, color);
        } else {
          dmSent = await DMBuzzerManager.startBuzzing(this.client, userId, title, message, color);
        }

        // Fallback: If DM was requested but user has DMs disabled, try channel if available
        if (!dmSent && channelId && notificationType === 'dm') {
          await DiscordNotifier.sendChannelAlert(this.client, channelId, userId, title, message, color, mentionTag, singleAlert);
        }
      }

      // 2.1. Mirror sang Telegram nếu có TELEGRAM_CHAT_ID để điện thoại reo chuông 100% không miss
      const mirrorTgChatId = process.env.TELEGRAM_CHAT_ID;
      if (mirrorTgChatId && TelegramBotClient.isReady()) {
        await TelegramBotClient.dispatchTelegramAlert(mirrorTgChatId, title, message, singleAlert);
      }
    }

    // 3. Voice Notification
    if ((notificationType === 'voice' || notificationType === 'all') && guildId && this.client) {
      await VoiceNotifier.playVoiceAlert(guildId);
      // If voice-only, also send a quiet fallback text in channel if available
      if (notificationType === 'voice' && channelId) {
        await DiscordNotifier.sendChannelAlert(this.client, channelId, userId, `🔊 ${title}`, message, color);
      }
    }
  }
}
