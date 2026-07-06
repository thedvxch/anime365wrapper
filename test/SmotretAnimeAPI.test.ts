import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SmotretAnimeAPI } from '../src/api/SmotretAnimeAPI.js';
import { AnimeApiError, AnimeApiNetworkError } from '../src/errors/AnimeApiError.js';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('SmotretAnimeAPI', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('отдаёт data из успешного ответа', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: { id: 1, title: 'Test' } }));
    const api = new SmotretAnimeAPI();

    const series = await api.getSeriesById(1);

    expect(series).toEqual({ id: 1, title: 'Test' });
    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('https://smotret-anime.online/api/series/1');
  });

  it('бросает AnimeApiError, если тело содержит error, даже при HTTP 200', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: { code: 404, message: 'Series not found.' } }));
    const api = new SmotretAnimeAPI();

    await expect(api.getSeriesById(999999999)).rejects.toMatchObject(
      new AnimeApiError(404, 'Series not found.')
    );
  });

  it('бросает AnimeApiNetworkError при сбое сети (одиночный домен, без fallback)', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    const api = new SmotretAnimeAPI({ baseUrl: 'https://example-mirror.test/api' });

    await expect(api.getSeriesById(1)).rejects.toBeInstanceOf(AnimeApiNetworkError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('перебирает зеркала по умолчанию при сетевых сбоях и запоминает рабочее', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed')); // smotret-anime.online
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed')); // smotret-anime.app
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: { id: 1, title: 'Test' } })); // smotret-anime.org

    const api = new SmotretAnimeAPI();
    const series = await api.getSeriesById(1);

    expect(series).toEqual({ id: 1, title: 'Test' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[0][0])).toContain('smotret-anime.online');
    expect(String(fetchMock.mock.calls[1][0])).toContain('smotret-anime.app');
    expect(String(fetchMock.mock.calls[2][0])).toContain('smotret-anime.org');
    expect(api.activeBaseUrl).toBe('https://smotret-anime.org/api');

    // следующий запрос начинается сразу с последнего рабочего зеркала
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: { id: 2, title: 'Second' } }));
    await api.getSeriesById(2);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(String(fetchMock.mock.calls[3][0])).toContain('smotret-anime.org');
  });

  it('не переключает зеркало на ошибке самого API (AnimeApiError)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: { code: 404, message: 'Series not found.' } }));
    const api = new SmotretAnimeAPI();

    await expect(api.getSeriesById(999999999)).rejects.toBeInstanceOf(AnimeApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(api.activeBaseUrl).toBe('https://smotret-anime.online/api');
  });

  it('бросает AnimeApiNetworkError, если недоступны все зеркала', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));
    const api = new SmotretAnimeAPI({ baseUrl: ['https://a.test/api', 'https://b.test/api'] });

    await expect(api.getSeriesById(1)).rejects.toBeInstanceOf(AnimeApiNetworkError);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('добавляет access_token в URL после логина', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: { access_token: 'tok123' } }));
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: { id: 1, isLogined: true, name: 'x', isPremium: false, premiumUntil: '' } }));

    const api = new SmotretAnimeAPI();
    const token = await api.login('a@b.com', 'pass');
    expect(token).toBe('tok123');

    await api.getCurrentUser();
    const [meUrl] = fetchMock.mock.calls[1];
    expect(String(meUrl)).toContain('access_token=tok123');
  });

  it('getCurrentUser без токена падает без похода в сеть', async () => {
    const api = new SmotretAnimeAPI();
    await expect(api.getCurrentUser()).rejects.toThrow(/авторизация/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('передаёт параметры фида и afterId для getTranslations', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: [] }));
    const api = new SmotretAnimeAPI();

    await api.getTranslations({ feed: 'id', afterId: 10000 });

    const [url] = fetchMock.mock.calls[0];
    const parsed = new URL(String(url));
    expect(parsed.pathname).toBe('/api/translations/');
    expect(parsed.searchParams.get('feed')).toBe('id');
    expect(parsed.searchParams.get('afterId')).toBe('10000');
  });

  it('собирает chips из условий для getSeriesList', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: [] }));
    const api = new SmotretAnimeAPI();

    await api.getSeriesList({ chips: [{ field: 'genre', operator: '@=', value: [8, 35] }, 'genre_op=and'] });

    const [url] = fetchMock.mock.calls[0];
    const parsed = new URL(String(url));
    expect(parsed.searchParams.get('chips')).toBe('genre@=8,35;genre_op=and');
  });

  it('приводит относительный subtitlesUrl к абсолютному', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: {
          embedUrl: 'https://smotret-anime.org/translations/embed/1',
          download: [],
          stream: [],
          subtitlesUrl: '/episodeTranslations/1.ass?willcache',
          subtitlesVttUrl: 'https://smotret-anime.online/translations/vtt/1',
        },
      })
    );
    const api = new SmotretAnimeAPI();

    const embed = await api.getTranslationEmbed(1);

    expect(embed.subtitlesUrl).toBe('https://smotret-anime.online/episodeTranslations/1.ass?willcache');
  });

  it('позволяет сменить домен через baseUrl', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: [] }));
    const api = new SmotretAnimeAPI({ baseUrl: 'https://example-mirror.test/api' });

    await api.getSeriesList();

    const [url] = fetchMock.mock.calls[0];
    expect(String(url).startsWith('https://example-mirror.test/api/series/')).toBe(true);
    expect(api.socialLoginUrl).toBe('https://example-mirror.test/users/login');
  });
});
