import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UserSession } from '../src/api/UserSession.js';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

describe('UserSession', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('сохраняет access_token после login и переиспользует его в прокси-методах', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: { access_token: 'tok456' } }));
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: { isLogined: true, id: 1, name: 'x', isPremium: false, premiumUntil: '' } }));

    const session = new UserSession();
    await session.login('a@b.com', 'pass');
    expect(session.getAccessToken()).toBe('tok456');

    await session.getCurrentUser();
    const [url] = fetchMock.mock.calls[1];
    expect(String(url)).toContain('access_token=tok456');
  });

  it('проксирует getTranslations/getSeriesList/getEpisodeById', async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ data: [] }));
    const session = new UserSession();

    await session.getTranslations({ feed: 'recent' });
    await session.getSeriesList({ query: 'naruto' });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('даёт доступ к нижележащему клиенту через .client', () => {
    const session = new UserSession({ baseUrl: 'https://example-mirror.test/api' });
    expect(session.client.socialLoginUrl).toBe('https://example-mirror.test/users/login');
  });
});
