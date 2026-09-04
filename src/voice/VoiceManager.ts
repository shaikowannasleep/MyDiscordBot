import { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus } from '@discordjs/voice';
import { VoiceBasedChannel } from 'discord.js';
import { VoiceSessionRepository } from '../database/repositories/VoiceSessionRepository';
import { AlarmRepository } from '../database/repositories/AlarmRepository';
import { VoiceSession } from '../domain/VoiceSession';

export class VoiceManager {
  /**
   * Joins user's voice channel and initiates a VoiceSession.
   */
  public static async joinChannel(channel: VoiceBasedChannel, userId: string): Promise<VoiceSession | null> {
    try {
      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator as any,
        selfDeaf: false,
        selfMute: false
      });

      // Close any previous open session for this guild
      VoiceSessionRepository.endAllForGuild(channel.guild.id);

      // Create new active session in DB
      const session = VoiceSessionRepository.create({
        userId,
        guildId: channel.guild.id,
        channelId: channel.id,
        startedAt: Date.now(),
        active: true
      });

      connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            new Promise((resolve) => connection.once(VoiceConnectionStatus.Signalling, resolve)),
            new Promise((resolve) => connection.once(VoiceConnectionStatus.Connecting, resolve)),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Voice timeout')), 5000))
          ]);
        } catch {
          connection.destroy();
          if (session.id) {
            VoiceSessionRepository.endSession(session.id);
          }
        }
      });

      return session;
    } catch (error) {
      console.error(`[VoiceManager] Failed to join channel ${channel.id}:`, error);
      return null;
    }
  }

  /**
   * Disconnects voice, ends session, cleans up temporary alarms, keeps persistent events.
   */
  public static exitVoice(guildId: string): { cancelledAlarmsCount: number } {
    const connection = getVoiceConnection(guildId);
    if (connection) {
      connection.destroy();
    }

    const activeSession = VoiceSessionRepository.findActiveByGuildId(guildId);
    let cancelledAlarmsCount = 0;

    if (activeSession && activeSession.id) {
      VoiceSessionRepository.endSession(activeSession.id);
      // Cancel temporary alarms tied to this session
      cancelledAlarmsCount = AlarmRepository.disableByVoiceSessionId(activeSession.id);
    }

    return { cancelledAlarmsCount };
  }

  public static isConnected(guildId: string): boolean {
    const connection = getVoiceConnection(guildId);
    return connection !== undefined && connection.state.status !== VoiceConnectionStatus.Destroyed;
  }
}
