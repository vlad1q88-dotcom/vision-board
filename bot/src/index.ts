import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Bot } from 'grammy';
import { loadConfig } from './config.ts';
import { ChallengeService } from './service.ts';
import { Store } from './storage/store.ts';
import { wire } from './telegram/bot.ts';

const envFile = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

const config = loadConfig();
const store = new Store(config.dataFile);
await store.load();

const service = new ChallengeService(store, { timezone: config.timezone });
const bot = new Bot(config.token);
wire(bot, service);

await bot.api.setMyCommands([
  { command: 'new', description: 'бросить вызов' },
  { command: 'join', description: 'принять вызов по коду' },
  { command: 'begin', description: 'запустить челлендж' },
  { command: 'board', description: 'показать лидер-борд' },
  { command: 'boards', description: 'мои челленджи' },
  { command: 'badges', description: 'мои бейджи' },
  { command: 'nick', description: 'сменить ник' },
  { command: 'rules', description: 'правила и бейджи' },
  { command: 'help', description: 'помощь' },
  { command: 'cancel', description: 'прервать диалог' },
]);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void bot.stop().then(() => service.save());
  });
}

console.log(`Бот запущен. Часовой пояс челленджей: ${config.timezone}. Данные: ${config.dataFile}`);
await bot.start();
