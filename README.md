# Anime365Wrapper

[![npm version](https://img.shields.io/npm/v/anime365wrapper.svg?style=flat-square)](https://www.npmjs.com/package/anime365wrapper)
[![npm downloads](https://img.shields.io/npm/dt/anime365wrapper.svg?style=flat-square)](https://www.npmjs.com/package/anime365wrapper)
[![Node.js version](https://img.shields.io/node/v/anime365wrapper.svg?style=flat-square)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg?style=flat-square)](https://www.typescriptlang.org/)

<p align="center">
  <img src="https://raw.githubusercontent.com/thedvxchsquad/anime365wrapper/master/.github/logo.png" alt="Anime365Wrapper Logo" width="200">
</p>

> **Anime365Wrapper** — это современная TypeScript обёртка для API [anime365.ru (smotret-anime)](https://smotret-anime.online/api), обеспечивающая полную типизацию и поддержку как ESM, так и CommonJS модулей.

## ✨ Особенности

- 🔥 **Полная поддержка TypeScript** с экспортом всех типов
- 📦 **ESM и CommonJS** совместимость
- 🛡️ **Безопасность** - корректная обработка авторизации
- 🚀 **Современный API** с async/await поддержкой
- 📚 **Полная типизация** всех методов и возвращаемых данных
- 🔧 **Гибкая настройка** базового URL и User-Agent
- ⚡ **Быстрая работа** с кэшированием токенов

## 📋 Требования

- **Node.js** 10.0.0 или выше
- **TypeScript** 4.0+ (опционально, для типизации)

## 🚀 Установка

```bash
# npm
npm install anime365wrapper

# yarn
yarn add anime365wrapper

# pnpm
pnpm add anime365wrapper
```

## 📖 Быстрый старт

### ESM / TypeScript

```typescript
import { SmotretAnimeAPI, UserSession } from 'anime365wrapper';
import type { Translation, Series } from 'anime365wrapper';

const api = new SmotretAnimeAPI();

// Получение списка переводов
const translations: Translation[] = await api.getTranslations('recent');
console.log(`Получено переводов: ${translations.length}`);

// Получение списка аниме
const series: Series[] = await api.getSeriesList({ limit: 10 });
console.log(`Получено серий: ${series.length}`);
```

### CommonJS

```javascript
const { SmotretAnimeAPI, UserSession } = require('anime365wrapper');

const api = new SmotretAnimeAPI();

// Получение списка переводов
api.getTranslations('recent')
  .then(translations => {
    console.log(`Получено переводов: ${translations.length}`);
  })
  .catch(console.error);
```

## 🔐 Авторизация

### SmotretAnimeAPI

```typescript
import { SmotretAnimeAPI } from 'anime365wrapper';

const api = new SmotretAnimeAPI();

// Авторизация
try {
  const token = await api.login('your_email@example.com', 'your_password');
  console.log('Токен получен:', token);
  
  // Теперь можно использовать методы, требующие авторизации
  const user = await api.getCurrentUser();
  console.log('Пользователь:', user);
} catch (error) {
  console.error('Ошибка авторизации:', error.message);
}
```

### UserSession (рекомендуется)

```typescript
import { UserSession } from 'anime365wrapper';

const session = new UserSession();

// Авторизация с автоматическим сохранением токена
try {
  const token = await session.login('your_email@example.com', 'your_password');
  console.log('Успешная авторизация');
  
  // Токен автоматически сохраняется для последующих запросов
  const translations = await session.getTranslations('recent');
  console.log('Переводы:', translations);
} catch (error) {
  console.error('Ошибка:', error.message);
}
```

## 📚 API Документация

### SmotretAnimeAPI

#### Конструктор

```typescript
new SmotretAnimeAPI(baseUrl?: string, userAgent?: string, accessToken?: string)
```

**Параметры:**
- `baseUrl` - Базовый URL API (по умолчанию: `https://smotret-anime.online/api`)
- `userAgent` - User-Agent для запросов (по умолчанию: `Anime365Wrapper/1.0`)
- `accessToken` - Токен авторизации (опционально)

#### Методы

##### 🔐 Авторизация

```typescript
// Установка токена
setAccessToken(token: string): void

// Авторизация по email и паролю
login(email: string, password: string): Promise<string>
```

##### 📺 Переводы

```typescript
// Получение списка переводов
getTranslations(feed?: 'recent' | 'id' | 'all', afterId?: number): Promise<Translation[]>

// Получение перевода по ID
getTranslationById(id: number): Promise<Translation>

// Получение данных для встраивания
getTranslationEmbed(id: number): Promise<EmbedTranslation>
```

##### 🎬 Аниме (серии)

```typescript
// Получение списка аниме
getSeriesList(params?: {
  fields?: string;
  chips?: string;
  myAnimeListId?: number;
  query?: string;
  pretty?: number;
  limit?: number;
  offset?: number;
}): Promise<Series[]>

// Получение аниме по ID
getSeriesById(id: number): Promise<Series>
```

##### 📝 Эпизоды

```typescript
// Получение эпизода по ID
getEpisodeById(id: number): Promise<Episode>
```

##### 👤 Пользователь

```typescript
// Получение информации о текущем пользователе (требует авторизации)
getCurrentUser(): Promise<User>
```

### UserSession

```typescript
// Конструктор
new UserSession(apiBaseUrl?: string, userAgent?: string)

// Авторизация с сохранением токена
login(email: string, password: string): Promise<string>

// Установка токена
setAccessToken(token: string): void

// Прокси-методы
getTranslations(feed?: 'recent' | 'id' | 'all', afterId?: number): Promise<Translation[]>
```

## 🎯 Примеры использования

### Поиск аниме

```typescript
import { SmotretAnimeAPI } from 'anime365wrapper';

const api = new SmotretAnimeAPI();

// Поиск по названию
const searchResults = await api.getSeriesList({
  query: 'naruto',
  limit: 10
});

console.log('Найдено аниме:', searchResults.length);
searchResults.forEach(series => {
  console.log(`- ${series.title} (${series.year})`);
});
```

### Получение информации о переводе

```typescript
import { SmotretAnimeAPI } from 'anime365wrapper';

const api = new SmotretAnimeAPI();

// Получение последних переводов
const recentTranslations = await api.getTranslations('recent');

if (recentTranslations.length > 0) {
  const firstTranslation = recentTranslations[0];
  
  // Получение детальной информации
  const detailedTranslation = await api.getTranslationById(firstTranslation.id);
  console.log('Детали перевода:', detailedTranslation);
  
  // Получение данных для встраивания
  const embedData = await api.getTranslationEmbed(firstTranslation.id);
  console.log('Embed данные:', embedData);
}
```

### Работа с сессией

```typescript
import { UserSession } from 'anime365wrapper';

const session = new UserSession();

async function main() {
  try {
    // Авторизация
    await session.login('your_email@example.com', 'your_password');
    
    // Получение переводов (токен автоматически используется)
    const translations = await session.getTranslations('recent');
    
    // Получение информации о пользователе
    const user = await session.getCurrentUser();
    console.log('Пользователь:', user);
    
  } catch (error) {
    console.error('Ошибка:', error.message);
  }
}

main();
```

## 🏗️ Типы данных

Библиотека экспортирует все необходимые типы:

```typescript
import type {
  Translation,
  Series,
  Episode,
  User,
  EmbedTranslation,
  ApiResponse
} from 'anime365wrapper';
```

### Translation

```typescript
interface Translation {
  id: number;
  title: string;
  type: string;
  seriesId: number;
  episodeId: number;
  isActive: number;
  priority: number;
  authorsList: string[];
  // ... и другие поля
}
```

### Series

```typescript
interface Series {
  id: number;
  title: string;
  year: number;
  type: string;
  numberOfEpisodes: number;
  isActive: number;
  isAiring: number;
  allTitles: string[];
  // ... и другие поля
}
```

## 🛠️ Разработка

### Установка зависимостей

```bash
git clone https://github.com/thedvxchsquad/anime365wrapper.git
cd anime365wrapper
npm install
```

### Сборка

```bash
npm run build
```

### Тестирование

```bash
npm test
```

## 📞 Поддержка

- 🐛 **Баги и предложения**: [GitHub Issues](https://github.com/thedvxchsquad/anime365wrapper/issues)
- 📖 **Документация API**: [TSDocs](https://tsdocs.dev)
- 💬 **Обсуждения**: [GitHub Discussions](https://github.com/thedvxchsquad/anime365wrapper/discussions)