import {
  Client,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors
} from 'discord.js';

export interface BuzzerSession {
  userId: string;
  title: string;
  message: string;
  color: number;
  intervalTimer: NodeJS.Timeout;
  repeatCount: number;
  maxRepeats: number;
  intervalMs: number;
  alarmId?: string | number;
}

export class DMBuzzerManager {
  private static activeSessions = new Map<string, BuzzerSession>();

  /**
   * Start a persistent buzzing alert in DM for a user until acknowledged.
   */
  public static async startBuzzing(
    client: Client,
    userId: string,
    title: string,
    message: string,
    color: number = Colors.Red,
    alarmId?: string | number,
    options?: { maxRepeats?: number; intervalMs?: number }
  ): Promise<boolean> {
    // 1. If an existing buzzer is active for this user, clear it first
    this.stopBuzzing(userId);

    const maxRepeats = options?.maxRepeats ?? 20; // 20 times x 20s = ~6.6 minutes
    const intervalMs = options?.intervalMs ?? 5000; // 20 seconds between alerts

    try {
      const user = await client.users.fetch(userId).catch(() => null);
      if (!user) return false;

      // Send initial buzzer DM
      const row = this.createAckButtonRow(userId);
      const embed = new EmbedBuilder()
        .setTitle(`🚨 [BÁO THỨC LIÊN TỤC] ${title}`)
        .setDescription(
          `${message}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `⚡ **CHẾ ĐỘ BÁO THỨC LIÊN TỤC:**\n` +
          `🔔 Bot sẽ liên tục gửi tin nhắn mỗi 20 giây cho đến khi bạn **ĐÃ ĐỌC**!\n` +
          `👉 **Cách tắt chuông:**\n` +
          `1. Bấm nút **[🔕 ĐÃ ĐỌC / TẮT CHUÔNG]** bên dưới, HOẶC\n` +
          `2. Nhắn bất kỳ chữ gì vào đây (ví dụ: "ok", "dậy rồi", "rồi").`
        )
        .setColor(color)
        .setTimestamp();

      const initialMsg = await user.send({
        content: `🚨 <@${userId}> **DẬY ĐI ÔNG CHÁU ƠI! ĐẾN GIỜ RỒI!**`,
        embeds: [embed],
        components: [row]
      }).catch((err) => {
        console.warn(`[DMBuzzerManager] Unable to send initial DM to ${userId}:`, err?.message || err);
        return null;
      });

      if (!initialMsg) return false;

      // Start repeating buzzer interval
      let repeatCount = 1;
      const intervalTimer = setInterval(async () => {
        repeatCount++;

        if (repeatCount > maxRepeats) {
          this.stopBuzzing(userId);
          await user.send({
            content: `⏰ **Đã tự động tắt chuông báo** cho sự kiện **${title}** sau ${maxRepeats} lần nhắc nhở (hơn 6 phút). Chúc bạn may mắn!`
          }).catch(() => {});
          return;
        }

        try {
          const repeatEmbed = new EmbedBuilder()
            .setTitle(`🚨 [NHẮC LẦN ${repeatCount}/${maxRepeats}] ⏰ ${title}`)
            .setDescription(
              `${message}\n\n` +
              `🔥 **DẬY ĐI / ĐI SĂN BOSS ĐI ÔNG CHÁU ƠI!**\n` +
              `👉 Bấm nút bên dưới hoặc nhắn bất kỳ tin nhắn nào vào đây để tắt!`
            )
            .setColor(Colors.DarkRed)
            .setTimestamp();

          const repeatRow = this.createAckButtonRow(userId);
          await user.send({
            content: `🔔 <@${userId}> **DẬY ĐI BẠN ƠI! (Lần nhắc nhở ${repeatCount}/${maxRepeats})**`,
            embeds: [repeatEmbed],
            components: [repeatRow]
          });
        } catch (err) {
          console.warn(`[DMBuzzerManager] Error sending recurring buzzer to ${userId}:`, err);
          this.stopBuzzing(userId);
        }
      }, intervalMs);

      this.activeSessions.set(userId, {
        userId,
        title,
        message,
        color,
        intervalTimer,
        repeatCount,
        maxRepeats,
        intervalMs,
        alarmId
      });

      console.log(`[DMBuzzerManager] Persistent DM buzzer started for user ${userId} (${title})`);
      return true;
    } catch (err) {
      console.error(`[DMBuzzerManager] Failed to start buzzer for user ${userId}:`, err);
      return false;
    }
  }

  /**
   * Stop the active buzzer for a user.
   */
  public static stopBuzzing(userId: string): boolean {
    const session = this.activeSessions.get(userId);
    if (!session) return false;

    clearInterval(session.intervalTimer);
    this.activeSessions.delete(userId);
    console.log(`[DMBuzzerManager] Buzzer stopped for user ${userId} (${session.title})`);
    return true;
  }

  public static hasActiveBuzzer(userId: string): boolean {
    return this.activeSessions.has(userId);
  }

  public static getActiveSession(userId: string): BuzzerSession | undefined {
    return this.activeSessions.get(userId);
  }

  public static stopAll(): void {
    for (const [userId, session] of this.activeSessions.entries()) {
      clearInterval(session.intervalTimer);
    }
    this.activeSessions.clear();
  }

  private static createAckButtonRow(userId: string): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`btn:ack_buzzer:${userId}`)
        .setLabel('🔕 ĐÃ ĐỌC / TẮT CHUÔNG')
        .setStyle(ButtonStyle.Success)
    );
  }
}
