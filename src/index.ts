import dotenv from 'dotenv';
dotenv.config();

import { DiscordBotClient } from './bot/DiscordClient';

async function main() {
  console.log('--------------------------------------------------');
  console.log('⏰ Discord Game Alarm Bot (Hoyo Buddy Reference UX)');
  console.log('   Version: V1.0');
  console.log('   Timezone: ' + (process.env.DEFAULT_TIMEZONE || 'Asia/Ho_Chi_Minh'));
  console.log('--------------------------------------------------');

  const bot = new DiscordBotClient();

  const shutdown = () => {
    console.log('\n[Main] Gracefully shutting down Discord Bot...');
    bot.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await bot.start();
}

main().catch((err) => {
  console.error('[Main] Fatal bootstrap error:', err);
  process.exit(1);
});
