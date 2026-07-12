import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RequestManager } from './RequestManager.js';
import { HTTPError, FluxerAPIError, RateLimitError } from './errors/index.js';

function jsonResponse(
  body: unknown,
  init: { ok?: boolean; status?: number; headers?: Record<string, string> } = {},
): Response {
  const status = init.status ?? 200;
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return {
    ok: init.ok ?? (status >= 200 && status < 300),
    status,
    text: () => Promise.resolve(text),
    headers: new Headers({
      'Content-Type': 'application/json',
      ...init.headers,
    }),
  } as unknown as Response;
}

describe('RequestManager', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('constructor uses defaults', () => {
    const rm = new RequestManager({});
    expect(rm.baseUrl).toBe('https://api.fluxer.app/v1');
  });

  it('constructor accepts overrides', () => {
    const rm = new RequestManager({ api: 'https://test', version: '2' });
    expect(rm.baseUrl).toBe('https://test/v2');
  });

  it('request succeeds with JSON body', async () => {
    const rm = new RequestManager({ retries: 0 });
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: '123' }));
    const result = await rm.request('GET', '/channels/123');
    expect(result).toEqual({ id: '123' });
  });

  it('request returns undefined for 204', async () => {
    const rm = new RequestManager({ retries: 0 });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 204,
      text: () => Promise.resolve(''),
      headers: new Headers(),
    });
    const result = await rm.request('DELETE', '/channels/123');
    expect(result).toBeUndefined();
  });

  it('request throws FluxerAPIError for non-ok with JSON body', async () => {
    const rm = new RequestManager({ retries: 0 });
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ code: 'UNKNOWN_CHANNEL', message: 'Unknown Channel' }, { status: 404 }),
    );
    await expect(rm.request('GET', '/channels/999')).rejects.toThrow(FluxerAPIError);
  });

  it('request throws HTTPError for non-JSON error body', async () => {
    const rm = new RequestManager({ retries: 0 });
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
      headers: new Headers(),
    });
    await expect(rm.request('GET', '/channels/1')).rejects.toThrow(HTTPError);
  });

  it('retries retryable 5xx HTTPError then succeeds', async () => {
    const rm = new RequestManager({ retries: 2 });
    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: () => Promise.resolve('unavailable'),
        headers: new Headers(),
      })
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    const result = await rm.request('GET', '/channels/1');
    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries RateLimitError then succeeds', async () => {
    const rm = new RequestManager({ retries: 1 });
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(
          { code: 'RATE_LIMITED', message: 'slow down', retry_after: 0 },
          { status: 429, headers: { 'Retry-After': '0' } },
        ),
      )
      .mockResolvedValueOnce(jsonResponse({ id: '1' }));
    const result = await rm.request('GET', '/channels/1');
    expect(result).toEqual({ id: '1' });
  });

  it('throws RateLimitError when retries exhausted', async () => {
    const rm = new RequestManager({ retries: 0 });
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ code: 'RATE_LIMITED', message: 'slow down', retry_after: 1 }, { status: 429 }),
    );
    await expect(rm.request('GET', '/channels/1')).rejects.toThrow(RateLimitError);
  });

  it('builds multipart when files provided without body', async () => {
    const rm = new RequestManager({ retries: 0 });
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 'm1' }));
    await rm.request('POST', '/channels/1/messages', {
      files: [{ name: 'a.txt', data: new Uint8Array([1]) }],
    });
    const init = fetchMock.mock.calls[0]?.[1] as { body: FormData };
    expect(init.body).toBeInstanceOf(FormData);
    expect(init.body.get('payload_json')).toBeTruthy();
    expect(init.body.get('files[0]')).toBeTruthy();
  });

  it('request uses full URL when route starts with http', async () => {
    const rm = new RequestManager({ retries: 0 });
    fetchMock.mockResolvedValueOnce(jsonResponse({}));
    await rm.request('GET', 'https://cdn.example.com/asset/123');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://cdn.example.com/asset/123',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('request aborts when signal is aborted before fetch', async () => {
    const rm = new RequestManager({ retries: 3 });
    const ac = new AbortController();
    ac.abort();
    await expect(rm.request('GET', '/channels/1', { signal: ac.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('request does not retry on user AbortError from fetch', async () => {
    const rm = new RequestManager({ retries: 3 });
    const ac = new AbortController();
    fetchMock.mockImplementationOnce(() => {
      ac.abort();
      return Promise.reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
    });
    await expect(rm.request('GET', '/channels/1', { signal: ac.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('getRouteHash LRU keeps repeatedly used route when cache is full', () => {
    const rm = new RequestManager({});
    const getRouteHash = (
      rm as unknown as { getRouteHash: (r: string) => string }
    ).getRouteHash.bind(rm);
    const hot = '/channels/11111111111111111';
    for (let i = 0; i < 1000; i++) {
      getRouteHash(`/channels/${100000000000000000n + BigInt(i)}`);
    }
    getRouteHash(hot);
    getRouteHash(hot);
    for (let i = 0; i < 999; i++) {
      getRouteHash(`/guilds/${200000000000000000n + BigInt(i)}`);
    }
    expect(getRouteHash(hot)).toBe('/channels/:id');
  });
});
