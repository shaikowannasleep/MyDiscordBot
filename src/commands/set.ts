import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, Colors } from 'discord.js';
import { TimeParser } from '../utils/TimeParser';
import { AlarmRepository } from '../database/repositories/AlarmRepository';
import { VoiceSessionRepository } from '../database/repositories/VoiceSessionRepository';

export const data = new SlashCommandBuilder()
  .setName('set')
  .setDescription('Set a quick timer (e.g. 20s, 20m, 1h, 2h30m)')
  .addStringOption(option =>
    option.setName('duration')
      .setDescription('Duration of timer (e.g. 20s, 20m, 1h, 2h30m)')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('title')
      .setDescription('Optional name or reminder label')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const durationInput = interaction.options.getString('duration', true);
  const title = interaction.options.getString('title') || 'Quick Timer';

  const parsed = TimeParser.parseDuration(durationInput);
  if (!parsed) {
    await interaction.reply({
      content: '❌ Định dạng thời gian không hợp lệ. Ví dụ: `20s`, `20m`, `1h`, `2h30m`.',
      ephemeral: true
    });
    return;
  }

  const triggerAt = Date.now() + parsed.totalMilliseconds;
  const activeSession = interaction.guildId
    ? VoiceSessionRepository.findActiveByGuildId(interaction.guildId)
    : null;

  const alarm = AlarmRepository.create({
    userId: interaction.user.id,
    guildId: interaction.guildId || undefined,
    channelId: interaction.channelId || undefined,
    type: 'quick',
    title,
    triggerAt,
    notificationType: activeSession ? 'all' : 'channel',
    voiceSessionId: activeSession?.id,
    enabled: true
  });

  const embed = new EmbedBuilder()
    .setTitle('✅ Alarm created')
    .setColor(Colors.Green)
    .addFields(
      { name: '🏷️ Tên báo thức', value: title, inline: true },
      { name: '⏰ Thời gian', value: parsed.formatted, inline: true },
      { name: '🔔 Thông báo', value: activeSession ? 'Discord + Voice' : 'Discord channel', inline: false }
    )
    .setFooter({ text: `ID: #${alarm.id} · Dùng /cancel ${alarm.id} để hủy` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
