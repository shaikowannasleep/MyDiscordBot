import { Client, EmbedBuilder, Colors } from 'discord.js';

export class DMNotifier {
  public static async sendDMAlert(
    client: Client,
    userId: string,
    title: string,
    description: string,
    color: number = Colors.Blue
  ): Promise<boolean> {
    try {
      const user = await client.users.fetch(userId);
      if (!user) return false;

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp();

      await user.send({ embeds: [embed] });
      return true;
    } catch (error) {
      console.warn(`[DMNotifier] Unable to send DM to user ${userId} (DMs might be closed).`);
      return false;
    }
  }
}
