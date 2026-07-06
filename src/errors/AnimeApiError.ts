/**
 * Ошибка, возвращаемая API smotret-anime.online.
 * API всегда отвечает HTTP 200 и кодирует ошибки в теле как `{ error: { code, message } }`,
 * поэтому проверка `response.ok` не позволяет их обнаружить — нужно разбирать тело ответа.
 */
export class AnimeApiError extends Error {
  public readonly code: number;

  constructor(code: number, message: string) {
    super(message);
    this.name = 'AnimeApiError';
    this.code = code;
  }
}

/** Сетевая ошибка транспортного уровня (таймаут, DNS, недоступность хоста и т.д.). */
export class AnimeApiNetworkError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'AnimeApiNetworkError';
  }
}
