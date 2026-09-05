import { Bot, InlineKeyboard } from 'grammy';
import { AlarmRepository } from '../database/repositories/AlarmRepository';
import { TimeParser } from '../utils/TimeParser';
import { Alarm } from '../domain/Alarm';

export interface TelegramBuzzerSession {
  chatId: string;
  title: string;
  message: string;
  intervalTimer: NodeJS.Timeout;
  repeatCount: number;
  maxRepeats: number;
}

export class TelegramBotClient {
  private static bot: Bot | null = null;
  private static activeBuzzers = new Map<string, TelegramBuzzerSession>();

  public static isReady(): boolean {
    return this.bot !== null;
  }

  public static async start(token?: string): Promise<void> {
    const botToken = token || process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      console.log('ℹ️ [TelegramBot] TELEGRAM_BOT_TOKEN is not set. Telegram Bot is skipped.');
      console.log('👉 Tip: Create a bot with @BotFather on Telegram and add TELEGRAM_BOT_TOKEN to .env for 100% reliable mobile push alarms.');
      return;
    }

    try {
      this.bot = new Bot(botToken);
      this.setupHandlers();

      // Launch long-polling
      this.bot.start({
        onStart: (botInfo) => {
          console.log(`🤖 [TelegramBot] Logged in as @${botInfo.username} (${botInfo.first_name})`);
          console.log('🚀 [TelegramBot] Instant push alarms & persistent buzzer ready on Telegram!');
        }
      });
    } catch (error) {
      console.error('❌ [TelegramBot] Failed to start Telegram Bot:', error);
      this.bot = null;
    }
  }

  public static stop(): void {
    if (this.bot) {
      this.stopAllBuzzers();
      this.bot.stop();
      this.bot = null;
      console.log('🛑 [TelegramBot] Telegram bot stopped.');
    }
  }

  private static setupHandlers(): void {
    if (!this.bot) return;

    // 1. /start & /help
    this.bot.command(['start', 'help'], async (ctx) => {
      const chatId = ctx.chat.id;
      const helpText =
        `👋 **Chào bạn! Tôi là Game Alarm Assistant trên Telegram** ⏰\n\n` +
        `📱 **Chat ID của bạn:** \`${chatId}\`\n` +
        `(Bạn có thể copy Chat ID này dán vào \`TELEGRAM_CHAT_ID\` trong file .env để nhận báo thức từ Discord)\n\n` +
        `💬 **CÁC LỆNH HẸN GIỜ TRỰC TIẾP:**\n` +
        `• \`/set 20m [tên]\` - Hẹn giờ nhanh (VD: \`/set 20m Điểm danh\`)\n` +
        `• \`/boss 30m [tên]\` - Đếm ngược săn Boss (VD: \`/boss 30m World Boss\`)\n` +
        `• Gõ tắt: \`.9p30s [tên]\` hoặc \`1d23h5p3s\`\n` +
        `• \`/list\` - Xem danh sách báo thức đang chạy\n` +
        `• \`/stop\` hoặc \`/tat\` - Tắt chuông báo thức liên tục\n\n` +
        `🔔 **Ưu điểm Telegram:** Không bao giờ bị miss thông báo trên điện thoại! Chuông báo sẽ rung liên tục cho đến khi bạn bấm nút xác nhận.`;

      await ctx.reply(helpText, { parse_mode: 'Markdown' });
    });

    // 2. /list
    this.bot.command('list', async (ctx) => {
      const userId = `tg:${ctx.from?.id || ctx.chat.id}`;
      const alarms = AlarmRepository.findActiveByUserId(userId);

      if (alarms.length === 0) {
        await ctx.reply('📭 Bạn hiện chưa có hẹn giờ nào đang hoạt động trên Telegram.');
        return;
      }

      const listText = alarms
        .map((a: Alarm) => {
          const remainingSec = Math.max(0, Math.floor((a.triggerAt - Date.now()) / 1000));
          const mins = Math.floor(remainingSec / 60);
          const secs = remainingSec % 60;
          return `• **#${a.id}** [${a.type.toUpperCase()}] **${a.title}** (còn ~${mins}m${secs}s)`;
        })
        .join('\n');

      await ctx.reply(`⏰ **DANH SÁCH BÁO THỨC CỦA BẠN:**\n\n${listText}`, { parse_mode: 'Markdown' });
    });

    // 3. /stop, /off, /tat
    this.bot.command(['stop', 'off', 'tat'], async (ctx) => {
      const chatId = String(ctx.chat.id);
      const stopped = this.stopBuzzer(chatId);
      if (stopped) {
        await ctx.reply('🔕 **Đã tắt chuông báo thức liên tục!**', { parse_mode: 'Markdown' });
      } else {
        await ctx.reply('ℹ️ Hiện bạn không có chuông báo thức nào đang rung.');
      }
    });

    // 4. /set
    this.bot.command('set', async (ctx) => {
      const text = ctx.match?.trim() || '';
      const parts = text.split(/\s+/);
      const durationStr = parts[0];
      const title = parts.slice(1).join(' ') || 'Quick Timer';

      if (!durationStr) {
        await ctx.reply('❌ Vui lòng nhập thời gian. Ví dụ: `/set 20m Họp team`', { parse_mode: 'Markdown' });
        return;
      }

      const parsed = TimeParser.parseDuration(durationStr);
      if (!parsed) {
        await ctx.reply('❌ Định dạng thời gian không hợp lệ. Ví dụ: `20m`, `1h30m`, `9p30s`.');
        return;
      }

      const userId = `tg:${ctx.from?.id || ctx.chat.id}`;
      const alarm = AlarmRepository.create({
        userId,
        channelId: String(ctx.chat.id),
        type: 'quick',
        title,
        triggerAt: Date.now() + parsed.totalMilliseconds,
        notificationType: 'dm',
        enabled: true
      });

      const timeLabel = parsed.formattedVi || parsed.formatted;
      await ctx.reply(
        `✅ Đã tạo hẹn giờ **${title}**:\n⏳ Đếm ngược: **${timeLabel}** (ID: #${alarm.id})\n🔔 Bot sẽ báo thẳng vào Telegram khi đến giờ!`,
        { parse_mode: 'Markdown' }
      );
    });

    // 5. /boss
    this.bot.command('boss', async (ctx) => {
      const text = ctx.match?.trim() || '';
      const parts = text.split(/\s+/);
      const durationStr = parts[0];
      const bossName = parts.slice(1).join(' ') || 'World Boss';

      if (!durationStr) {
        await ctx.reply('❌ Vui lòng nhập thời gian. Ví dụ: `/boss 30m Hắc Ám Long Vương`', { parse_mode: 'Markdown' });
        return;
      }

      const parsed = TimeParser.parseDuration(durationStr);
      if (!parsed) {
        await ctx.reply('❌ Định dạng thời gian săn Boss không hợp lệ. Ví dụ: `30m`, `2h`, `1h30m`.');
        return;
      }

      const userId = `tg:${ctx.from?.id || ctx.chat.id}`;
      const alarm = AlarmRepository.create({
        userId,
        channelId: String(ctx.chat.id),
        type: 'boss',
        title: bossName,
        triggerAt: Date.now() + parsed.totalMilliseconds,
        notificationType: 'dm',
        enabled: true
      });

      const timeLabel = parsed.formattedVi || parsed.formatted;
      await ctx.reply(
        `🐉 Đã bắt đầu đếm ngược Boss **${bossName}**:\n⏳ Hồi sinh sau: **${timeLabel}** (ID: #${alarm.id})\n🔥 Bot sẽ rung chuông liên tục trên Telegram khi Boss xuất hiện!`,
        { parse_mode: 'Markdown' }
      );
    });

    // 6. Callback Query for Ack Button
    this.bot.callbackQuery(/^ack_buzzer:(.+)$/, async (ctx) => {
      const targetChatId = ctx.match[1];
      this.stopBuzzer(targetChatId);

      await ctx.answerCallbackQuery({ text: '✅ Đã tắt chuông báo thức!' });
      await ctx.editMessageText('🔕 **ĐÃ XÁC NHẬN ĐÃ ĐỌC!**\nĐã tắt chuông báo thức liên tục. Chúc bạn chơi game vui vẻ!', {
        parse_mode: 'Markdown'
      }).catch(() => {});
    });

    // 7. General text message: Handles shorthand (".9p30s") and buzzer dismissal on reply
    this.bot.on('message:text', async (ctx) => {
      const text = ctx.message.text.trim();
      const chatId = String(ctx.chat.id);

      // If buzzer is ringing for this chat, any message acknowledges and stops it!
      if (this.activeBuzzers.has(chatId)) {
        const session = this.activeBuzzers.get(chatId);
        const title = session ? session.title : 'báo thức';
        this.stopBuzzer(chatId);

        await ctx.reply(
          `🔕 **ĐÃ TẮT CHUÔNG BÁO THỨC!**\nBot đã nhận được tin nhắn của bạn và xác nhận bạn đã đọc thông báo cho **${title}**. Chúc bạn chơi game vui vẻ!`,
          { parse_mode: 'Markdown' }
        );

        // If user was just acknowledging ("ok", "dậy rồi"), stop here
        if (!text.startsWith('.') && !text.startsWith('/') && !text.startsWith('!')) {
          return;
        }
      }

      // Shorthand handling: e.g. .9p30s [tên] or 9p30s
      let cleanText = text;
      if (cleanText.startsWith('.') || cleanText.startsWith('!')) {
        cleanText = cleanText.substring(1).trim();
      }

      const parts = cleanText.split(/\s+/);
      const command = parts[0];
      const parsedDuration = TimeParser.parseDuration(command);

      if (parsedDuration) {
        const title = parts.slice(1).join(' ') || 'Quick Timer';
        const isBoss = title.toLowerCase().includes('boss') || title.toLowerCase().includes('săn boss');
        const userId = `tg:${ctx.from?.id || ctx.chat.id}`;

        const alarm = AlarmRepository.create({
          userId,
          channelId: String(ctx.chat.id),
          type: isBoss ? 'boss' : 'quick',
          title,
          triggerAt: Date.now() + parsedDuration.totalMilliseconds,
          notificationType: 'dm',
          enabled: true
        });

        const icon = isBoss ? '🐉' : '⏰';
        const timeLabel = parsedDuration.formattedVi || parsedDuration.formatted;
        await ctx.reply(
          `${icon} Đã tạo hẹn giờ **${title}**:\n⏳ Đếm ngược: **${timeLabel}** (ID: #${alarm.id})\n🔔 Thông báo sẽ gửi trực tiếp về Telegram!`,
          { parse_mode: 'Markdown' }
        );
      }
    });
  }

  /**
   * Send single alert or start persistent buzzer to a Telegram Chat.
   */
  public static async dispatchTelegramAlert(
    chatId: string,
    title: string,
    message: string,
    singleAlert: boolean = false
  ): Promise<boolean> {
    if (!this.bot) return false;

    try {
      if (singleAlert) {
        await this.bot.api.sendMessage(
          chatId,
          `🔔 **${title}**\n\n${message}`,
          { parse_mode: 'Markdown' }
        );
        return true;
      }

      // Start persistent buzzer on Telegram
      this.stopBuzzer(chatId);

      const keyboard = new InlineKeyboard().text('🔕 ĐÃ ĐỌC / TẮT CHUÔNG', `ack_buzzer:${chatId}`);
      const alertText =
        `🚨 **[BÁO THỨC LIÊN TỤC] ${title}**\n\n` +
        `${message}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `⚡ **CHẾ ĐỘ CHUÔNG REO LIÊN TỤC:**\n` +
        `🔔 Bot sẽ tiếp tục gửi tin nhắn mỗi 20 giây cho đến khi bạn **ĐÃ ĐỌC**!\n` +
        `👉 **Cách tắt:** Bấm nút bên dưới hoặc gửi bất kỳ tin nhắn nào vào đây.`;

      await this.bot.api.sendMessage(chatId, alertText, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

      let repeatCount = 1;
      const maxRepeats = 20;
      const intervalMs = 20000;

      const intervalTimer = setInterval(async () => {
        repeatCount++;

        if (repeatCount > maxRepeats) {
          this.stopBuzzer(chatId);
          await this.bot?.api.sendMessage(
            chatId,
            `⏰ **Đã tự động tắt chuông báo** cho sự kiện **${title}** sau ${maxRepeats} lần nhắc nhở.`,
            { parse_mode: 'Markdown' }
          ).catch(() => {});
          return;
        }

        try {
          const repeatKeyboard = new InlineKeyboard().text('🔕 ĐÃ ĐỌC / TẮT CHUÔNG', `ack_buzzer:${chatId}`);
          await this.bot?.api.sendMessage(
            chatId,
            `🚨 **[NHẮC LẦN ${repeatCount}/${maxRepeats}] ⏰ ${title}**\n\n` +
            `🔥 **DẬY ĐI / ĐI SĂN BOSS ĐI ÔNG CHÁU ƠI!**\n` +
            `👉 Bấm nút bên dưới hoặc nhắn tin vào đây để tắt!`,
            {
              parse_mode: 'Markdown',
              reply_markup: repeatKeyboard
            }
          );
        } catch (err) {
          console.warn(`[TelegramBot] Error sending repeat buzzer to ${chatId}:`, err);
          this.stopBuzzer(chatId);
        }
      }, intervalMs);

      this.activeBuzzers.set(chatId, {
        chatId,
        title,
        message,
        intervalTimer,
        repeatCount,
        maxRepeats
      });

      return true;
    } catch (error) {
      console.error(`[TelegramBot] Failed to send alert to chatId ${chatId}:`, error);
      return false;
    }
  }

  public static stopBuzzer(chatId: string): boolean {
    const session = this.activeBuzzers.get(chatId);
    if (!session) return false;

    clearInterval(session.intervalTimer);
    this.activeBuzzers.delete(chatId);
    return true;
  }

  public static stopAllBuzzers(): void {
    for (const [chatId, session] of this.activeBuzzers.entries()) {
      clearInterval(session.intervalTimer);
    }
    this.activeBuzzers.clear();
  }
}
