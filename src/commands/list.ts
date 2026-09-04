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
import { DateUtils } from '../utils/DateUtils';
import { DateTime } from 'luxon';

export const data = new SlashCommandBuilder()
  .setName('list')
  .setDescription('List all your active alarms and recurring events');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const userId = interaction.user.id;
  const alarms = AlarmRepository.findActiveByUserId(userId);
  const events = EventRepository.findActiveByUserId(userId);

  const totalItems = alarms.length + events.length;
  if (totalItems === 0) {
    await interaction.reply({
      content: '📭 Bạn hiện chưa có báo thức hoặc sự kiện nào đang hoạt động.',
      ephemeral: true
    });
    return;
  }

  // Combine items for display
  const items: string[] = [];

  alarms.forEach((alarm) => {
    const targetDt = DateTime.fromMillis(alarm.triggerAt).setZone(DateUtils.DEFAULT_TIMEZONE);
    const friendlyTime = DateUtils.formatFriendly(targetDt);
    const icon = alarm.type === 'boss' ? '🐉' : '⏰';
    items.push(`**#${alarm.id} · ${icon} ${alarm.title}**\n   ${friendlyTime} · Type: ${alarm.type.toUpperCase()}`);
  });

  events.forEach((event) => {
    const repeatStr = event.repeatType === 'weekly' ? 'Weekly' : 'Daily';
    items.push(`**#E${event.id} · ⚔️ ${event.name}**\n   ${repeatStr} · ${event.time} · Notify: ${event.notificationType.toUpperCase()}`);
  });

  const pageSize = 5;
  const pageCount = Math.ceil(items.length / pageSize);
  const currentPage = 1;
  const pageItems = items.slice(0, pageSize);

  const embed = new EmbedBuilder()
    .setTitle('⏰ MY ALARMS & EVENTS')
    .setColor(Colors.DarkBlue)
    .setDescription(pageItems.join('\n\n'))
    .setFooter({ text: `Page ${currentPage}/${pageCount} · Tổng cộng: ${items.length} mục` })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`btn:list:page:1:${pageCount}`).setLabel('◀').setStyle(ButtonStyle.Secondary).setDisabled(true),
    new ButtonBuilder().setCustomId(`btn:list:page:2:${pageCount}`).setLabel('▶').setStyle(ButtonStyle.Secondary).setDisabled(pageCount <= 1),
    new ButtonBuilder().setCustomId('btn:cancel:all_prompt').setLabel('Cancel All Temp').setStyle(ButtonStyle.Danger)
  );

  await interaction.reply({ embeds: [embed], components: [row] });
}
