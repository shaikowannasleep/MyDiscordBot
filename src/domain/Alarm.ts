export type AlarmType = 'quick' | 'hour' | 'boss';
export type NotificationType = 'channel' | 'dm' | 'voice' | 'all';

export interface Alarm {
  id?: number;
  userId: string;
  guildId?: string;
  channelId?: string;
  type: AlarmType;
  title: string;
  triggerAt: number; // Unix timestamp in milliseconds
  notificationType: NotificationType;
  voiceSessionId?: number;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}
