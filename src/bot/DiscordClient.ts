import { Client, GatewayIntentBits, Partials, Events } from 'discord.js';
import { CommandRegistry } from './CommandRegistry';
import { InteractionRouter } from './InteractionRouter';
import { NotificationService } from '../notification/NotificationService';
import { AlarmScheduler } from '../scheduler/AlarmScheduler';
import { EventScheduler } from '../scheduler/EventScheduler';
import { Database } from '../database/Database';

export class DiscordBotClient {
  private client: Client;
  private commandRegistry: CommandRegistry;
  private alarmScheduler: AlarmScheduler | null = null;
  private eventScheduler: EventScheduler | null = null;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
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

      // Register slash commands if env vars provided
      const token = process.env.DISCORD_TOKEN;
      const clientId = process.env.CLIENT_ID || readyClient.user.id;
      const guildId = process.env.GUILD_ID;

      if (token && clientId) {
        await this.commandRegistry.registerSlashCommands(token, clientId, guildId);
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
