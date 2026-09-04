export interface VoiceSession {
  id?: number;
  userId: string;
  guildId: string;
  channelId: string;
  startedAt: number;
  endedAt?: number;
  active: boolean;
}
