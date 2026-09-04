import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, Colors } from 'discord.js';
import { VoiceManager } from '../voice/VoiceManager';

export const data = new SlashCommandBuilder()
  .setName('exit')
  .setDescription('End current voice session and disconnect bot from Voice Channel');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({ content: '❌ Lệnh này chỉ có thể sử dụng trong Server.', ephemeral: true });
    return;
  }

  const { cancelledAlarmsCount } = VoiceManager.exitVoice(interaction.guildId);

  const embed = new EmbedBuilder()
    .setTitle('👋 Voice session ended')
    .setColor(Colors.DarkGrey)
    .setDescription(
      `Đã ngắt kết nối khỏi phòng Voice.\n\n` +
      `• **${cancelledAlarmsCount}** temporary voice alarm(s) cancelled.\n` +
      `• Persistent events are still active in background scheduler.`
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
