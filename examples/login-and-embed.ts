// Авторизация и получение данных для воспроизведения перевода.
// Учётные данные передаются через переменные окружения — не храните пароль/токен в коде.
// Запуск: ANIME_EMAIL=... ANIME_PASSWORD=... npm run build && npx tsx examples/login-and-embed.ts <translationId>
import { UserSession } from 'anime365wrapper';

const { ANIME_EMAIL, ANIME_PASSWORD, ANIME_ACCESS_TOKEN } = process.env;
const translationId = Number(process.argv[2] ?? 905760);

const session = new UserSession({ userAgent: 'ExampleApp/1.0' });

if (ANIME_ACCESS_TOKEN) {
  session.setAccessToken(ANIME_ACCESS_TOKEN);
} else if (ANIME_EMAIL && ANIME_PASSWORD) {
  await session.login(ANIME_EMAIL, ANIME_PASSWORD);
} else {
  console.error('Укажите ANIME_ACCESS_TOKEN либо ANIME_EMAIL + ANIME_PASSWORD в переменных окружения.');
  process.exit(1);
}

const user = await session.getCurrentUser();
console.log(`Вошли как ${user.name} (id=${user.id}, premium=${user.isPremium})`);

const embed = await session.getTranslationEmbed(translationId);
console.log('Субтитры (ASS):', embed.subtitlesUrl);
for (const stream of embed.stream) {
  console.log(`Поток ${stream.height}p:`, stream.urls[0]);
}
