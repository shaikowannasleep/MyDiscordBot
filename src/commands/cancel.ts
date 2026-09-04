import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors
} from 'discord.js';
import { AlarmRepository } from '../database/repositories/AlarmRepository';
import { EventRepository } from '../database/repositories/EventRepository';

export const data = new SlashCommandBuilder()
  .setName('cancel')
  .setDescription('Cancel an alarm or recurring event by ID')
  .addStringOption(option =>
    option.setName('id')
      .setDescription('Alarm ID (e.g. 12 or E5 for recurring event)')
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const inputId = interaction.options.getString('id', true).trim();

  // Check if it's an event (starts with E)
  if (inputId.toUpperCase().startsWith('E')) {
    const eventId = parseInt(inputId.substring(1), 10);
    const event = EventRepository.findById(eventId);

    if (!event || event.userId !== interaction.user.id || !event.enabled) {
      await interaction.reply({ content: '❌ Không tìm thấy sự kiện hoặc bạn không có quyền hủy.', ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('⚠️ Hủy sự kiện định kỳ?')
      .setDescription(`Bạn có chắc muốn hủy sự kiện **${event.name}** (${event.repeatType} lúc ${event.time})?`)
      .setColor(Colors.Red);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`btn:confirm_del_event:${event.id}`).setLabel('Confirm').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('btn:cancel_action').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    return;
  }

  // Regular Alarm
  const alarmId = parseInt(inputId, 10);
  if (isNaN(alarmId)) {
    await interaction.reply({ content: '❌ ID không hợp lệ.', ephemeral: true });
    return;
  }

  const alarm = AlarmRepository.findById(alarmId);
  if (!alarm || alarm.userId !== interaction.user.id || !alarm.enabled) {
    await interaction.reply({ content: '❌ Alarm not found.', ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('⚠️ Delete this alarm?')
    .setDescription(`**${alarm.title}**\nLoại: ${alarm.type.toUpperCase()}`)
    .setColor(Colors.Red);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`btn:confirm_del:${alarm.id}`).setLabel('Confirm').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('btn:cancel_action').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}
