import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors } from 'discord.js';
import { TimeParser } from '../utils/TimeParser';
import { DateUtils } from '../utils/DateUtils';
import { AlarmRepository } from '../database/repositories/AlarmRepository';
import { VoiceSessionRepository } from '../database/repositories/VoiceSessionRepository';

export const data = new SlashCommandBuilder()
  .setName('boss')
  .setDescription('Start a Boss respawn countdown timer')
  .addStringOption(option =>
    option.setName('duration')
      .setDescription('Respawn duration (e.g. 30m, 2h, 1h30m)')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('name')
      .setDescription('Name of the Boss (e.g. World Boss, Baron)')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const durationInput = interaction.options.getString('duration', true);
  const bossName = interaction.options.getString('name') || 'World Boss';

  const parsed = TimeParser.parseDuration(durationInput);
  if (!parsed) {
    await interaction.reply({
      content: '❌ Thời gian săn Boss không hợp lệ. Ví dụ: `30m`, `2h`, `1h30m`.',
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
    type: 'boss',
    title: bossName,
    triggerAt,
    notificationType: activeSession ? 'all' : 'channel',
    voiceSessionId: activeSession?.id,
    enabled: true
  });

  const targetDt = DateUtils.now().plus({ milliseconds: parsed.totalMilliseconds });

  const embed = new EmbedBuilder()
    .setTitle('🐉 BOSS TIMER')
    .setDescription(`**${bossName}**`)
    .setColor(Colors.Orange)
    .addFields(
      { name: '⏰ Giờ hồi sinh (Spawn)', value: targetDt.toFormat('HH:mm:ss'), inline: true },
      { name: '⏳ Còn lại (Remaining)', value: parsed.formatted, inline: true },
      { name: '🔔 Thông báo qua', value: activeSession ? 'Channel + Voice' : 'Discord channel', inline: false }
    )
    .setFooter({ text: `Boss Timer ID: #${alarm.id}` })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`btn:cancel:${alarm.id}`)
      .setLabel('Cancel Timer')
      .setStyle(ButtonStyle.Danger)
  );

  await interaction.reply({ embeds: [embed], components: [row] });
}
