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

export const data = new SlashCommandBuilder()
  .setName('cancelall')
  .setDescription('Cancel all your active temporary alarms');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const activeAlarms = AlarmRepository.findActiveByUserId(interaction.user.id);

  if (activeAlarms.length === 0) {
    await interaction.reply({
      content: '📭 Bạn không có báo thức tạm thời nào đang chạy.',
      ephemeral: true
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('⚠️ Delete all temporary alarms?')
    .setDescription(`**${activeAlarms.length}** alarms will be removed.\n*(Các sự kiện định kỳ Daily/Weekly sẽ không bị ảnh hưởng)*`)
    .setColor(Colors.Orange);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('btn:confirm_del_all').setLabel('Confirm').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('btn:cancel_action').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}
