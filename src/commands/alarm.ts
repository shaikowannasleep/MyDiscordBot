import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  GuildMember
} from 'discord.js';
import { VoiceManager } from '../voice/VoiceManager';

export const data = new SlashCommandBuilder()
  .setName('alarm')
  .setDescription('Game Alarm Assistant & Voice Gateway')
  .addSubcommand(sub =>
    sub.setName('dashboard')
      .setDescription('Open the interactive Game Alarm Dashboard')
  )
  .addSubcommand(sub =>
    sub.setName('join')
      .setDescription('Connect bot to your current voice channel')
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const subcommand = interaction.options.getSubcommand(false) || 'dashboard';

  if (subcommand === 'join') {
    const member = interaction.member as GuildMember;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel) {
      await interaction.reply({
        content: '❌ You must be inside a Voice Channel.',
        ephemeral: true
      });
      return;
    }

    const session = await VoiceManager.joinChannel(voiceChannel, interaction.user.id);
    if (!session) {
      await interaction.reply({
        content: '❌ Bot does not have permission to join this Voice Channel.',
        ephemeral: true
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('🔊 Connected')
      .setColor(Colors.Green)
      .addFields(
        { name: 'Phòng (Channel)', value: voiceChannel.name, inline: true },
        { name: 'Trạng thái', value: 'Voice Alarm Mode: ON', inline: true }
      )
      .setFooter({ text: 'Dùng /exit để ngắt kết nối và kết thúc phiên voice' });

    await interaction.reply({ embeds: [embed] });
    return;
  }

  // Dashboard view
  const embed = new EmbedBuilder()
    .setTitle('⏰ GAME ALARM DASHBOARD')
    .setDescription('Chọn nhanh một thao tác hoặc tùy chọn hẹn giờ bên dưới:')
    .setColor(Colors.DarkGold)
    .addFields(
      { name: '⚡ Quick Timer', value: 'Bấm nút để đặt nhanh bộ đếm lùi:', inline: false },
      { name: '📅 Schedule & Game', value: 'Hẹn giờ cụ thể hoặc sự kiện lặp:', inline: false }
    )
    .setFooter({ text: 'Hoyo Buddy Style UX · Asia/Ho_Chi_Minh' });

  // Quick Timer row
  const rowQuick = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('btn:quick:10m').setLabel('10m').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('btn:quick:20m').setLabel('20m').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('btn:quick:30m').setLabel('30m').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('btn:quick:1h').setLabel('1h').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('btn:quick:2h').setLabel('2h').setStyle(ButtonStyle.Primary)
  );

  // Schedule row
  const rowSchedule = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('btn:modal:sethour').setLabel('Set Time').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn:modal:event_daily').setLabel('Daily Event').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn:modal:event_weekly').setLabel('Weekly Event').setStyle(ButtonStyle.Secondary)
  );

  // Game & Navigation row
  const rowGame = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('btn:modal:boss').setLabel('Boss Timer').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('btn:nav:my_alarms').setLabel('My Alarms').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn:voice:join').setLabel('Join Voice').setStyle(ButtonStyle.Success)
  );

  await interaction.reply({
    embeds: [embed],
    components: [rowQuick, rowSchedule, rowGame]
  });
}
