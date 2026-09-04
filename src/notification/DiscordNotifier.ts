import { Client, TextChannel, EmbedBuilder, Colors } from 'discord.js';

export class DiscordNotifier {
  public static async sendChannelAlert(
    client: Client,
    channelId: string,
    userId: string,
    title: string,
    description: string,
    color: number = Colors.Gold,
    mentionTag?: string
  ): Promise<boolean> {
    try {
      const channel = await client.channels.fetch(channelId);
      if (!channel || !channel.isTextBased()) return false;

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp();

      const baseMention = mentionTag ? mentionTag : `@everyone`;

      // Gửi 3 lần tin nhắn riêng biệt (cách nhau 1s) để Discord reo chuông / popup 3 lần liên tiếp
      // Lần 1
      await (channel as TextChannel).send({
        content: `🚨 **[THÔNG BÁO 1/3]** 🔔 ${baseMention} ĐÃ ĐẾN GIỜ: **${title}**!`
      });

      await new Promise((res) => setTimeout(res, 1000));

      // Lần 2
      await (channel as TextChannel).send({
        content: `🚨 **[THÔNG BÁO 2/3]** 🔔 ${baseMention} TẬP HỢP ANH EM: **${title}**!`
      });

      await new Promise((res) => setTimeout(res, 1000));

      // Lần 3 kèm Embed chi tiết
      await (channel as TextChannel).send({
        content: `🚨 **[THÔNG BÁO 3/3]** 🔔 ${baseMention} VÀO GAME NGAY: **${title}**!`,
        embeds: [embed]
      });

      return true;
    } catch (error) {
      console.error(`[DiscordNotifier] Failed to send to channel ${channelId}:`, error);
      return false;
    }
  }
}
