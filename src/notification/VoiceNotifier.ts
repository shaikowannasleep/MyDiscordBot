import { getVoiceConnection, createAudioPlayer, createAudioResource, AudioPlayerStatus } from '@discordjs/voice';
import fs from 'node:fs';
import path from 'node:path';

export class VoiceNotifier {
  /**
   * Plays an audio chime/beep or audio resource in the voice channel if connected.
   */
  public static async playVoiceAlert(guildId: string, customAudioPath?: string): Promise<boolean> {
    try {
      const connection = getVoiceConnection(guildId);
      if (!connection) {
        return false;
      }

      const player = createAudioPlayer();
      connection.subscribe(player);

      // Check if sound file exists, otherwise generate or use silence/chime
      const soundPath = customAudioPath || path.join(__dirname, '../../assets/alert.mp3');
      if (fs.existsSync(soundPath)) {
        const resource = createAudioResource(soundPath);
        player.play(resource);

        player.on(AudioPlayerStatus.Idle, () => {
          player.stop();
        });
      }

      return true;
    } catch (error) {
      console.error(`[VoiceNotifier] Failed to play voice alert in guild ${guildId}:`, error);
      return false;
    }
  }
}
