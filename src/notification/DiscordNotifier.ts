import { Client, TextChannel, EmbedBuilder, Colors } from 'discord.js';

export class DiscordNotifier {
  public static async sendChannelAlert(
    client: Client,
    channelId: string,
    userId: string,
    title: string,
    description: string,
    color: number = Colors.Gold
  ): Promise<boolean> {
    try {
      const channel = await client.channels.fetch(channelId);
      if (!channel || !channel.isTextBased()) return false;

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp();

      await (channel as TextChannel).send({
        content: `🔔 <@${userId}>`,
        embeds: [embed]
      });

      return true;
    } catch (error) {
      console.error(`[DiscordNotifier] Failed to send to channel ${channelId}:`, error);
      return false;
    }
  }
}
