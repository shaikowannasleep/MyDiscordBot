import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, Colors } from 'discord.js';
import { TimeParser } from '../utils/TimeParser';
import { DateUtils } from '../utils/DateUtils';
import { AlarmRepository } from '../database/repositories/AlarmRepository';
import { VoiceSessionRepository } from '../database/repositories/VoiceSessionRepository';

export const data = new SlashCommandBuilder()
  .setName('sethour')
  .setDescription('Set an alarm for a specific hour (e.g. 09:00, 19:04)')
  .addStringOption(option =>
    option.setName('time')
      .setDescription('Time in HH:mm format (e.g. 09:00, 19:04)')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('title')
      .setDescription('Optional alarm title')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const timeInput = interaction.options.getString('time', true);
  const title = interaction.options.getString('title') || 'Hour Alarm';

  const parsedTime = TimeParser.parseTimeOfDay(timeInput);
  if (!parsedTime) {
    await interaction.reply({
      content: '❌ Định dạng giờ không hợp lệ. Vui lòng nhập theo định dạng 24h: `09:00`, `19:04`.',
      ephemeral: true
    });
    return;
  }

  const { nextDateTime, isTomorrow } = DateUtils.getNextDailyTrigger(parsedTime.hour, parsedTime.minute);
  const triggerAt = nextDateTime.toMillis();

  const activeSession = interaction.guildId
    ? VoiceSessionRepository.findActiveByGuildId(interaction.guildId)
    : null;

  const alarm = AlarmRepository.create({
    userId: interaction.user.id,
    guildId: interaction.guildId || undefined,
    channelId: interaction.channelId || undefined,
    type: 'hour',
    title,
    triggerAt,
    notificationType: activeSession ? 'all' : 'channel',
    voiceSessionId: activeSession?.id,
    enabled: true
  });

  const friendlySchedule = isTomorrow
    ? `Tomorrow · ${nextDateTime.toFormat('HH:mm')}`
    : `Today · ${nextDateTime.toFormat('HH:mm')}`;

  const embed = new EmbedBuilder()
    .setTitle('✅ Alarm created')
    .setColor(Colors.Blue)
    .addFields(
      { name: '🏷️ Tiêu đề', value: title, inline: true },
      { name: '⏰ Thời gian', value: friendlySchedule, inline: true },
      { name: '🌏 Múi giờ', value: 'Asia/Ho_Chi_Minh', inline: true },
      { name: '🔔 Phương thức', value: activeSession ? 'Discord + Voice' : 'Discord channel', inline: false }
    )
    .setFooter({ text: `ID: #${alarm.id} · Dùng /cancel ${alarm.id} để hủy` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
