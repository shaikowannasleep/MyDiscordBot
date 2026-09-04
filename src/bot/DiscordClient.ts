import {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors
} from 'discord.js';
import { CommandRegistry } from './CommandRegistry';
import { InteractionRouter } from './InteractionRouter';
import { NotificationService } from '../notification/NotificationService';
import { AlarmScheduler } from '../scheduler/AlarmScheduler';
import { EventScheduler } from '../scheduler/EventScheduler';
import { Database } from '../database/Database';
import { TimeParser } from '../utils/TimeParser';
import { AlarmRepository } from '../database/repositories/AlarmRepository';
import { VoiceManager } from '../voice/VoiceManager';
import { Alarm } from '../domain/Alarm';

export class DiscordBotClient {
  private client: Client;
  private commandRegistry: CommandRegistry;
  private alarmScheduler: AlarmScheduler | null = null;
  private eventScheduler: EventScheduler | null = null;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages
      ],
      partials: [Partials.Channel, Partials.Message]
    });

    this.commandRegistry = new CommandRegistry();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.once(Events.ClientReady, async (readyClient) => {
      console.log(`🤖 [DiscordBotClient] Logged in as ${readyClient.user.tag}`);

      // Initialize database
      Database.getInstance();

      // Initialize notification & scheduler services
      const notificationService = new NotificationService(this.client);
      this.alarmScheduler = new AlarmScheduler(notificationService);
      this.eventScheduler = new EventScheduler(notificationService);

      this.alarmScheduler.start();
      this.eventScheduler.start();

      // Register slash commands: Global and instantly for all joined guilds
      const token = process.env.DISCORD_TOKEN;
      const clientId = process.env.CLIENT_ID || readyClient.user.id;

      if (token && clientId) {
        // 1. Instant registration for all current guilds (takes 0.5s instead of 1 hour)
        for (const [guildId, guild] of readyClient.guilds.cache) {
          console.log(`[CommandRegistry] Syncing instant slash commands to guild: ${guild.name} (${guildId})`);
          await this.commandRegistry.registerSlashCommands(token, clientId, guildId);
        }

        // 2. Also register globally
        await this.commandRegistry.registerSlashCommands(token, clientId);
      }
    });

    this.client.on(Events.InteractionCreate, async (interaction) => {
      try {
        if (interaction.isChatInputCommand()) {
          const command = this.commandRegistry.getCommand(interaction.commandName);
          if (command) {
            await command.execute(interaction);
          } else {
            await interaction.reply({ content: '❌ Lệnh không tồn tại.', ephemeral: true });
          }
          return;
        }

        if (interaction.isButton()) {
          await InteractionRouter.handleButton(interaction);
          return;
        }

        if (interaction.isModalSubmit()) {
          await InteractionRouter.handleModal(interaction);
          return;
        }
      } catch (error) {
        console.error('[DiscordBotClient] Interaction error:', error);
        const replyPayload = { content: '❌ Đã xảy ra lỗi khi xử lý thao tác của bạn.', ephemeral: true };
        if (interaction.isRepliable()) {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(replyPayload).catch(() => {});
          } else {
            await interaction.reply(replyPayload).catch(() => {});
          }
        }
      }
    });

    // Direct Text Chat & Prefix Support (!alarm, !set, !boss, etc.)
    this.client.on(Events.MessageCreate, async (message) => {
      try {
        if (message.author.bot) return;

        const isDM = !message.guild;
        const botMention = `<@${this.client.user?.id}>`;
        const content = message.content.trim();

        let commandText = '';

        if (isDM) {
          // In DM: can type with or without prefix (!, . or plain text)
          commandText = (content.startsWith('!') || content.startsWith('.')) ? content.substring(1).trim() : content;
        } else if (content.startsWith('!') || content.startsWith('.')) {
          commandText = content.substring(1).trim();
        } else if (content.startsWith(botMention)) {
          commandText = content.replace(botMention, '').trim();
        } else {
          return; // Regular server chat not addressed to bot
        }

        const args = commandText.split(/\s+/);
        const command = args[0]?.toLowerCase();

        if (command === 'alarm' || command === 'help' || command === 'dashboard') {
          const embed = new EmbedBuilder()
            .setTitle('⏰ GAME ALARM DASHBOARD')
            .setDescription('Chào bạn! Dưới đây là bảng điều khiển nhắc giờ:')
            .setColor(Colors.DarkGold)
            .addFields(
              { name: '⚡ Quick Timer', value: 'Bấm nút để hẹn giờ nhanh:', inline: false },
              { name: '💬 Lệnh chat trực tiếp', value: '• `!set 20m [tên]` - Hẹn giờ nhanh\n• `!sethour 09:00` - Báo thức theo giờ\n• `!boss 30m [tên]` - Đếm ngược săn boss\n• `!list` - Xem danh sách hẹn giờ\n• `!exit` - Rời phòng Voice', inline: false }
            )
            .setFooter({ text: 'Hoyo Buddy Style UX · Asia/Ho_Chi_Minh' });

          const rowQuick = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('btn:quick:10m').setLabel('10m').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('btn:quick:20m').setLabel('20m').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('btn:quick:30m').setLabel('30m').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('btn:quick:1h').setLabel('1h').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('btn:quick:2h').setLabel('2h').setStyle(ButtonStyle.Primary)
          );

          const rowGame = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('btn:modal:boss').setLabel('Boss Timer').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('btn:nav:my_alarms').setLabel('My Alarms').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('btn:voice:join').setLabel('Join Voice').setStyle(ButtonStyle.Success)
          );

          await message.reply({ embeds: [embed], components: [rowQuick, rowGame] });
          return;
        }

        if (command === 'set') {
          const duration = args[1];
          const title = args.slice(2).join(' ') || 'Quick Timer';
          const parsed = TimeParser.parseDuration(duration || '');

          if (!parsed) {
            await message.reply('❌ Định dạng thời gian không hợp lệ. Ví dụ: `!set 20m` hoặc `!set 1h boss`.');
            return;
          }

          const alarm = AlarmRepository.create({
            userId: message.author.id,
            guildId: message.guild?.id,
            channelId: message.channel.id,
            type: 'quick',
            title,
            triggerAt: Date.now() + parsed.totalMilliseconds,
            notificationType: isDM ? 'dm' : 'channel',
            enabled: true
          });

          const unixSec = Math.floor(alarm.triggerAt / 1000);
          await message.reply(`✅ Đã tạo hẹn giờ **${title}**: đếm ngược **<t:${unixSec}:R>** (lúc <t:${unixSec}:T>) (ID: #${alarm.id})!`);
          return;
        }

        if (command === 'boss') {
          const duration = args[1];
          const bossName = args.slice(2).join(' ') || 'World Boss';
          const parsed = TimeParser.parseDuration(duration || '');

          if (!parsed) {
            await message.reply('❌ Thời gian săn Boss không hợp lệ. Ví dụ: `!boss 30m World Boss`.');
            return;
          }

          const alarm = AlarmRepository.create({
            userId: message.author.id,
            guildId: message.guild?.id,
            channelId: message.channel.id,
            type: 'boss',
            title: bossName,
            triggerAt: Date.now() + parsed.totalMilliseconds,
            notificationType: isDM ? 'dm' : 'channel',
            enabled: true
          });

          const unixSec = Math.floor(alarm.triggerAt / 1000);
          await message.reply(`🐉 Đã bắt đầu đếm ngược săn **${bossName}**: hồi sinh lúc <t:${unixSec}:T> (⏳ **<t:${unixSec}:R>**) (ID: #${alarm.id})!`);
          return;
        }

        if (command === 'list') {
          const alarms = AlarmRepository.findActiveByUserId(message.author.id);
          if (alarms.length === 0) {
            await message.reply('📭 Bạn hiện chưa có báo thức nào đang hoạt động.');
            return;
          }
          const listText = alarms.map((a: Alarm) => `• **#${a.id}** [${a.type.toUpperCase()}] ${a.title}`).join('\n');
          await message.reply(`⏰ **Danh sách báo thức của bạn:**\n${listText}`);
          return;
        }

        if (command === 'exit' && message.guild) {
          const { cancelledAlarmsCount } = VoiceManager.exitVoice(message.guild.id);
          await message.reply(`👋 Đã ngắt kết nối Voice (${cancelledAlarmsCount} temporary voice alarms cancelled).`);
          return;
        }

        // Default friendly response
        if (isDM || content.startsWith(botMention)) {
          await message.reply('👋 Chào bạn! Tôi là **Dậy đi ông cháu ơi** - Trợ lý hẹn giờ game.\n👉 Bạn có thể gõ `!alarm` để mở bảng điều khiển, hoặc `!set 20m`, `!boss 30m` để hẹn giờ nhanh!');
        }
      } catch (err) {
        console.error('[DiscordBotClient] messageCreate error:', err);
      }
    });
  }

  public async start(token?: string): Promise<void> {
    const botToken = token || process.env.DISCORD_TOKEN;
    if (!botToken) {
      console.warn('⚠️ [DiscordBotClient] DISCORD_TOKEN is not set in environment or .env file.');
      console.log('ℹ️ Bot engine and services initialized in offline/test mode.');
      return;
    }
    await this.client.login(botToken);
  }

  public stop(): void {
    this.alarmScheduler?.stop();
    this.eventScheduler?.stop();
    this.client.destroy();
  }
}
