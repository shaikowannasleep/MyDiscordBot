import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors
} from 'discord.js';
import { EventRepository } from '../database/repositories/EventRepository';
import { TimeParser } from '../utils/TimeParser';

export const data = new SlashCommandBuilder()
  .setName('event')
  .setDescription('Game Events Assistant')
  .addSubcommand(sub =>
    sub.setName('dashboard')
      .setDescription('View active game events')
  )
  .addSubcommand(sub =>
    sub.setName('create')
      .setDescription('Create a new recurring game event')
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const subcommand = interaction.options.getSubcommand(false) || 'dashboard';

  if (subcommand === 'create') {
    const modal = new ModalBuilder()
      .setCustomId('modal:event_create')
      .setTitle('CREATE GAME EVENT');

    const nameInput = new TextInputBuilder()
      .setCustomId('event_name')
      .setLabel('Tên sự kiện (Event Name)')
      .setPlaceholder('Ví dụ: Thành Chiến, World Boss')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const timeInput = new TextInputBuilder()
      .setCustomId('event_time')
      .setLabel('Giờ diễn ra (HH:mm - Asia/Ho_Chi_Minh)')
      .setPlaceholder('Ví dụ: 19:04, 20:00')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const repeatInput = new TextInputBuilder()
      .setCustomId('event_repeat')
      .setLabel('Chu kỳ lặp (Daily hoặc Thứ trong tuần)')
      .setPlaceholder('Daily, Mon, Tue, Wed, Thu, Fri, Sat, Sun')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const notifyInput = new TextInputBuilder()
      .setCustomId('event_notify')
      .setLabel('Phương thức nhận tin (DM / Channel / All)')
      .setPlaceholder('DM, Channel hoặc All')
      .setStyle(TextInputStyle.Short)
      .setValue('Channel')
      .setRequired(false);

    const customMsgInput = new TextInputBuilder()
      .setCustomId('event_custom_msg')
      .setLabel('Nội dung tin nhắn & Tag (Tùy chọn)')
      .setPlaceholder('@everyone Săn boss Độ Ách Tai Nha nha ae...')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(timeInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(repeatInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(notifyInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(customMsgInput)
    );

    await interaction.showModal(modal);
    return;
  }

  // Dashboard
  const events = EventRepository.findActiveByUserId(interaction.user.id);
  const embed = new EmbedBuilder()
    .setTitle('⚔️ GAME EVENTS DASHBOARD')
    .setColor(Colors.Purple)
    .setTimestamp();

  if (events.length === 0) {
    embed.setDescription('Chưa có sự kiện định kỳ nào được tạo.\nBấm **Create Event** để thêm mới!');
  } else {
    embed.setDescription(
      events.map((e, idx) => {
        const repeatStr = e.repeatType === 'weekly'
          ? `Every ${TimeParser.getDayName(e.dayOfWeek || 1)}`
          : 'Daily';
        return `**${idx + 1}. ⚔️ ${e.name}**\n   ⏰ ${repeatStr} · ${e.time} (Thông báo: ${e.notificationType.toUpperCase()})\n   ID: #${e.id}`;
      }).join('\n\n')
    );
  }

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('btn:event:open_create').setLabel('Create Event').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('btn:nav:my_alarms').setLabel('My Alarms').setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({ embeds: [embed], components: [row] });
}
