import dotenv from 'dotenv';
dotenv.config();

import { DiscordBotClient } from './bot/DiscordClient';
import { TelegramBotClient } from './telegram/TelegramBotClient';
import { KeepAliveServer } from './server/KeepAliveServer';

async function main() {
  console.log('--------------------------------------------------');
  console.log('⏰ GAME ALARM & SCHEDULE BOT ENGINE');
  console.log('   Platforms: Discord & Telegram');
  console.log('   Timezone: ' + (process.env.DEFAULT_TIMEZONE || 'Asia/Ho_Chi_Minh'));
  console.log('--------------------------------------------------');

  // 1. Start HTTP Keep-Alive server (keeps free cloud hosting like Render/Koyeb 24/7 online)
  KeepAliveServer.start();

  // 2. Start Discord Bot Client
  const discordBot = new DiscordBotClient();
  await discordBot.start();

  // 3. Start Telegram Bot Client (if TELEGRAM_BOT_TOKEN is provided)
  await TelegramBotClient.start();

  const shutdown = () => {
    console.log('\n[Main] Gracefully shutting down bot services...');
    discordBot.stop();
    TelegramBotClient.stop();
    KeepAliveServer.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[Main] Fatal bootstrap error:', err);
  process.exit(1);
});
