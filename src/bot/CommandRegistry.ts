import {
  ChatInputCommandInteraction,
  Collection,
  REST,
  Routes,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder
} from 'discord.js';

import * as alarmCommand from '../commands/alarm';
import * as setCommand from '../commands/set';
import * as sethourCommand from '../commands/sethour';
import * as eventCommand from '../commands/event';
import * as bossCommand from '../commands/boss';
import * as listCommand from '../commands/list';
import * as cancelCommand from '../commands/cancel';
import * as cancelallCommand from '../commands/cancelall';
import * as exitCommand from '../commands/exit';

export interface CommandModule {
  data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | any;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export class CommandRegistry {
  private commands = new Collection<string, CommandModule>();

  constructor() {
    this.registerLocalCommands();
  }

  private registerLocalCommands(): void {
    const commandList: CommandModule[] = [
      alarmCommand,
      setCommand,
      sethourCommand,
      eventCommand,
      bossCommand,
      listCommand,
      cancelCommand,
      cancelallCommand,
      exitCommand
    ];

    for (const cmd of commandList) {
      if (cmd?.data?.name) {
        this.commands.set(cmd.data.name, cmd);
      }
    }
  }

  public getCommand(name: string): CommandModule | undefined {
    return this.commands.get(name);
  }

  public getAllData(): any[] {
    return Array.from(this.commands.values()).map(cmd => cmd.data.toJSON());
  }

  public async registerSlashCommands(token: string, clientId: string, guildId?: string): Promise<void> {
    const rest = new REST({ version: '10' }).setToken(token);
    const body = this.getAllData();

    try {
      console.log(`[CommandRegistry] Registering ${body.length} slash commands...`);

      if (guildId) {
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body });
        console.log(`[CommandRegistry] Successfully registered commands to guild: ${guildId}`);
      } else {
        await rest.put(Routes.applicationCommands(clientId), { body });
        console.log('[CommandRegistry] Successfully registered global slash commands.');
      }
    } catch (error) {
      console.error('[CommandRegistry] Error registering slash commands:', error);
    }
  }
}
