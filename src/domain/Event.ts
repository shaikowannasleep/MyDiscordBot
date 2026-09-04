export type EventRepeatType = 'daily' | 'weekly';

export interface GameEvent {
  id?: number;
  userId: string;
  guildId?: string;
  channelId?: string;
  name: string;
  time: string; // HH:mm format, e.g. "19:04"
  repeatType: EventRepeatType;
  dayOfWeek?: number; // 1 = Monday .. 7 = Sunday (for weekly)
  notificationType: 'channel' | 'dm' | 'voice' | 'all';
  customMessage?: string; // e.g. "Săn boss Độ Ách Tai Nha"
  mentionTag?: string; // e.g. "@everyone", "@here"
  enabled: boolean;
  nextTriggerAt: number; // Unix timestamp in milliseconds
  createdAt: number;
  updatedAt: number;
}
