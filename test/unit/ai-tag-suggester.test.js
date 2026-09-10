import { describe, it, expect, vi, afterEach } from 'vitest';
import { listAiModels, suggestTags } from '../../wallabagger/js/ai-tag-suggester.js';

function jsonResponse (data) {
    return {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(data)
    };
}

function tagResponse (content) {
    return jsonResponse({
        choices: [{ message: { content } }]
    });
}

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe('listAiModels', () => {
    it('uses the configured path and authentication while normalizing model IDs', async () => {
        const fetch = vi.fn().mockResolvedValue(jsonResponse({
            data: [
                { id: ' zeta ' },
                { id: 'Alpha' },
                { id: 'beta' },
                { id: 'alpha' },
                { id: '  ' }
            ]
        }));
        vi.stubGlobal('fetch', fetch);

        await expect(listAiModels({
            inferenceUrl: 'https://provider.example/custom/v1/',
            apiKey: ' secret '
        })).resolves.toEqual(['Alpha', 'beta', 'zeta']);

        expect(fetch).toHaveBeenCalledOnce();
        const [url, options] = fetch.mock.calls[0];
        expect(url).toBe('https://provider.example/custom/v1/models');
        expect(options.method).toBe('GET');
        expect(options.headers).toEqual({
            Accept: 'application/json',
            Authorization: 'Bearer secret'
        });
    });

    it('omits authorization for unauthenticated providers', async () => {
        const fetch = vi.fn().mockResolvedValue(jsonResponse({ data: [] }));
        vi.stubGlobal('fetch', fetch);

        await listAiModels({
            inferenceUrl: 'http://localhost:1234/v1',
            apiKey: '   '
        });

        expect(fetch.mock.calls[0][1].headers).toEqual({
            Accept: 'application/json'
        });
    });
});

describe('suggestTags', () => {
    it('submits the exact model and delimited page context with text truncated to 12,000 characters', async () => {
        const fetch = vi.fn().mockResolvedValue(tagResponse('{"tags":[]}'));
        vi.stubGlobal('fetch', fetch);
        const content = 'x'.repeat(12000) + 'NOT_SENT';

        await suggestTags({
            inferenceUrl: 'https://provider.example/v1',
            apiKey: null,
            model: 'chosen-model',
            url: 'https://article.example/read',
            title: 'Article title',
            content
        });

        const [url, options] = fetch.mock.calls[0];
        const body = JSON.parse(options.body);
        expect(url).toBe('https://provider.example/v1/chat/completions');
        expect(options.method).toBe('POST');
        expect(options.headers).toEqual({
            Accept: 'application/json',
            'Content-Type': 'application/json'
        });
        expect(body.model).toBe('chosen-model');
        expect(body.max_tokens).toBe(256);
        expect(body.thinking_budget_tokens).toBe(128);
        expect(body.messages).toHaveLength(1);
        expect(body.messages[0].role).toBe('user');
        expect(body.messages[0].content).toContain('--- PAGE START ---\nURL: https://article.example/read\nTITLE: Article title\nVISIBLE TEXT:\n');
        expect(body.messages[0].content).toContain('x'.repeat(12000));
        expect(body.messages[0].content).not.toContain('NOT_SENT');
        expect(body.messages[0].content).toContain('\n--- PAGE END ---');
    });

    it('reports request timing and completion diagnostics without logging page content', async () => {
        const debug = vi.fn();
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
            choices: [{
                finish_reason: 'stop',
                message: {
                    content: '{"tags":["one"]}',
                    reasoning_content: 'private reasoning'
                }
            }],
            usage: { prompt_tokens: 20, completion_tokens: 10, total_tokens: 30 }
        })));

        await expect(suggestTags({
            inferenceUrl: 'https://provider.example/v1',
            model: 'model',
            content: 'SENSITIVE PAGE CONTENT',
            debug
        })).resolves.toEqual(['one']);

        expect(debug).toHaveBeenCalledWith('AI inference HTTP request started', expect.objectContaining({
            url: 'https://provider.example/v1/chat/completions',
            method: 'POST',
            timeoutMs: 90000
        }));
        expect(debug).toHaveBeenCalledWith('AI tag completion received', expect.objectContaining({
            finishReason: 'stop',
            completionContent: '{"tags":["one"]}',
            reasoningContentLength: 17,
            usage: { prompt_tokens: 20, completion_tokens: 10, total_tokens: 30 }
        }));
        expect(debug).toHaveBeenCalledWith('AI tag completion parsed', {
            tagCount: 1,
            tags: ['one']
        });
        expect(JSON.stringify(debug.mock.calls)).not.toContain('SENSITIVE PAGE CONTENT');
    });

    it('retries one transient network failure after 1.5 seconds', async () => {
        vi.useFakeTimers();
        const debug = vi.fn();
        const fetch = vi.fn()
            .mockRejectedValueOnce(new TypeError('NetworkError when attempting to fetch resource.'))
            .mockResolvedValueOnce(tagResponse('{"tags":["recovered"]}'));
        vi.stubGlobal('fetch', fetch);

        const request = suggestTags({
            inferenceUrl: 'https://provider.example/v1',
            model: 'model',
            debug
        });
        await vi.advanceTimersByTimeAsync(1500);

        await expect(request).resolves.toEqual(['recovered']);
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(debug).toHaveBeenCalledWith('AI tag suggestion failed; retrying', {
            name: 'TypeError',
            message: 'NetworkError when attempting to fetch resource.',
            reason: 'network',
            attempt: 2,
            maxAttempts: 2,
            delayMs: 1500
        });
    });

    it('retries one malformed completion response after 1.5 seconds', async () => {
        vi.useFakeTimers();
        const debug = vi.fn();
        const fetch = vi.fn()
            .mockResolvedValueOnce(tagResponse('unfinished reasoning without JSON'))
            .mockResolvedValueOnce(tagResponse('{"tags":["recovered"]}'));
        vi.stubGlobal('fetch', fetch);

        const request = suggestTags({
            inferenceUrl: 'https://provider.example/v1',
            model: 'model',
            debug
        });
        await vi.advanceTimersByTimeAsync(1500);

        await expect(request).resolves.toEqual(['recovered']);
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(debug).toHaveBeenCalledWith('AI tag suggestion failed; retrying', {
            name: 'TypeError',
            message: 'Malformed AI tag suggestions response',
            reason: 'malformed-response',
            attempt: 2,
            maxAttempts: 2,
            delayMs: 1500
        });
    });

    it('does not retry provider HTTP errors', async () => {
        const fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 503,
            text: vi.fn().mockResolvedValue('unavailable')
        });
        vi.stubGlobal('fetch', fetch);

        await expect(suggestTags({
            inferenceUrl: 'https://provider.example/v1',
            model: 'model'
        })).rejects.toThrow('HTTP 503: unavailable');
        expect(fetch).toHaveBeenCalledOnce();
    });

    it.each([
        ['direct JSON', '{"tags":["one","two"]}'],
        ['fenced JSON', '```json\n{"tags":["one","two"]}\n```'],
        ['JSON surrounded by text', 'Suggestions: {"tags":["one","two"]} Thanks']
    ])('parses %s responses', async (name, content) => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(tagResponse(content)));

        await expect(suggestTags({
            inferenceUrl: 'https://provider.example/v1',
            model: 'model'
        })).resolves.toEqual(['one', 'two']);
    });

    it('cleans, deduplicates, and caps returned tags in provider order', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(tagResponse(JSON.stringify({
            tags: [' #One ', 'one', '', '#', 'Two', 'THREE', 'Four', 'Five', 'Six']
        }))));

        await expect(suggestTags({
            inferenceUrl: 'https://provider.example/v1',
            model: 'model'
        })).resolves.toEqual(['One', 'Two', 'THREE', 'Four', 'Five']);
    });

    it.each([
        {},
        { choices: [] },
        { choices: [{ message: {} }] },
        { choices: [{ message: { content: 'not JSON' } }] },
        { choices: [{ message: { content: '{"tags":"one"}' } }] },
        { choices: [{ message: { content: '{"tags":["one",2]}' } }] }
    ])('rejects malformed or empty completion responses', async response => {
        vi.useFakeTimers();
        const fetch = vi.fn().mockResolvedValue(jsonResponse(response));
        vi.stubGlobal('fetch', fetch);

        const request = suggestTags({
            inferenceUrl: 'https://provider.example/v1',
            model: 'model'
        });
        const rejection = expect(request).rejects.toThrow('Malformed AI tag suggestions response');
        await vi.advanceTimersByTimeAsync(1500);

        await rejection;
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('reports the HTTP status and response body for provider errors', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            status: 429,
            text: vi.fn().mockResolvedValue('rate limited')
        }));

        await expect(suggestTags({
            inferenceUrl: 'https://provider.example/v1',
            model: 'model'
        })).rejects.toThrow('HTTP 429: rate limited');
    });

    it('aborts requests after 90 seconds', async () => {
        vi.useFakeTimers();
        vi.stubGlobal('fetch', vi.fn((url, options) => new Promise((resolve, reject) => {
            options.signal.addEventListener('abort', () => {
                reject(new DOMException('Aborted', 'AbortError'));
            });
        })));

        const request = suggestTags({
            inferenceUrl: 'https://provider.example/v1',
            model: 'model'
        });
        const rejection = expect(request).rejects.toMatchObject({ name: 'AbortError' });
        await vi.advanceTimersByTimeAsync(90000);
        await rejection;
    });
});
