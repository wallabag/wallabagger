'use strict';

const REQUEST_TIMEOUT_MS = 90000;
const MAX_CONTENT_LENGTH = 12000;
const MAX_COMPLETION_TOKENS = 256;
const THINKING_BUDGET_TOKENS = 128;
const NETWORK_RETRY_DELAY_MS = 1500;

function normalizeInferenceUrl (inferenceUrl) {
    const url = new URL(inferenceUrl);
    if (!['http:', 'https:'].includes(url.protocol) ||
        url.username !== '' ||
        url.password !== '' ||
        url.search !== '' ||
        url.hash !== '') {
        throw new TypeError('Invalid AI inference URL');
    }

    return url.origin + url.pathname.replace(/\/+$/, '');
}

function getHeaders (apiKey, includeContentType = false) {
    const headers = {
        Accept: 'application/json'
    };
    if (includeContentType) {
        headers['Content-Type'] = 'application/json';
    }

    const normalizedApiKey = typeof (apiKey) === 'string' ? apiKey.trim() : '';
    if (normalizedApiKey !== '') {
        headers.Authorization = `Bearer ${normalizedApiKey}`;
    }
    return headers;
}

function debugLog (debug, message, details) {
    if (typeof debug === 'function') {
        debug(message, details);
    }
}

function errorDetails (error, elapsedMs) {
    return {
        name: error?.name || typeof error,
        message: error?.message || String(error),
        elapsedMs
    };
}

async function fetchJson (url, options, debug) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const startedAt = Date.now();

    debugLog(debug, 'AI inference HTTP request started', {
        url,
        method: options.method,
        timeoutMs: REQUEST_TIMEOUT_MS
    });

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        debugLog(debug, 'AI inference HTTP response received', {
            url,
            status: response.status,
            ok: response.ok,
            elapsedMs: Date.now() - startedAt
        });
        if (!response.ok) {
            let responseBody;
            try {
                responseBody = await response.text();
            } catch {
                responseBody = '<unreadable response body>';
            }
            throw new Error(`AI inference request failed with HTTP ${response.status}: ${responseBody}`);
        }
        return await response.json();
    } catch (error) {
        debugLog(debug, 'AI inference HTTP request failed', errorDetails(error, Date.now() - startedAt));
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

function isRetryableNetworkError (error) {
    return error instanceof TypeError &&
        /networkerror|failed to fetch|load failed/i.test(error.message);
}

function isMalformedTagResponse (error) {
    return error instanceof TypeError &&
        error.message === 'Malformed AI tag suggestions response';
}

function normalizeModels (data) {
    if (!data || !Array.isArray(data.data) ||
        data.data.some(model => !model || typeof (model.id) !== 'string')) {
        throw new TypeError('Malformed AI models response');
    }

    const seen = new Set();
    return data.data
        .map(model => model.id.trim())
        .filter(model => {
            const key = model.toLocaleLowerCase();
            if (model === '' || seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        })
        .sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' }));
}

function createPrompt ({ url, title, content }) {
    const visibleText = typeof (content) === 'string'
        ? content.slice(0, MAX_CONTENT_LENGTH)
        : '';
    return [
        'Suggest 3–5 short, durable, retrieval-worthy tags that describe the central topics of this page.',
        'Ignore navigation, cookie or login UI, errors, CAPTCHAs, advertisements, and other page chrome.',
        'Return only JSON in the form {"tags":["..."]}. Return {"tags":[]} when no useful tags can be identified.',
        '',
        '--- PAGE START ---',
        `URL: ${url || ''}`,
        `TITLE: ${title || ''}`,
        'VISIBLE TEXT:',
        visibleText,
        '--- PAGE END ---'
    ].join('\n');
}

function parseJson (value) {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function firstJsonObject (value) {
    for (let start = value.indexOf('{'); start !== -1; start = value.indexOf('{', start + 1)) {
        let depth = 0;
        let inString = false;
        let escaped = false;

        for (let index = start; index < value.length; index += 1) {
            const character = value[index];
            if (inString) {
                if (escaped) {
                    escaped = false;
                } else if (character === '\\') {
                    escaped = true;
                } else if (character === '"') {
                    inString = false;
                }
                continue;
            }

            if (character === '"') {
                inString = true;
            } else if (character === '{') {
                depth += 1;
            } else if (character === '}') {
                depth -= 1;
                if (depth === 0) {
                    return value.slice(start, index + 1);
                }
            }
        }
    }
    return null;
}

function parseTags (content) {
    if (typeof (content) !== 'string' || content.trim() === '') {
        throw new TypeError('Malformed AI tag suggestions response');
    }

    let result = parseJson(content);
    if (!result) {
        const fencedJson = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
        result = fencedJson ? parseJson(fencedJson[1]) : null;
    }
    if (!result) {
        const jsonObject = firstJsonObject(content);
        result = jsonObject ? parseJson(jsonObject) : null;
    }
    if (!result || !Array.isArray(result.tags) ||
        result.tags.some(tag => typeof (tag) !== 'string')) {
        throw new TypeError('Malformed AI tag suggestions response');
    }

    const seen = new Set();
    const tags = [];
    for (const value of result.tags) {
        const tag = value.trim().replace(/^#/, '').trim();
        const key = tag.toLocaleLowerCase();
        if (tag === '' || seen.has(key)) {
            continue;
        }
        seen.add(key);
        tags.push(tag);
        if (tags.length === 5) {
            break;
        }
    }
    return tags;
}

async function listAiModels ({ inferenceUrl, apiKey, debug }) {
    const data = await fetchJson(`${normalizeInferenceUrl(inferenceUrl)}/models`, {
        method: 'GET',
        headers: getHeaders(apiKey)
    }, debug);
    const models = normalizeModels(data);
    debugLog(debug, 'AI models parsed', { modelCount: models.length });
    return models;
}

async function requestAndParseTags (requestUrl, requestOptions, debug) {
    const data = await fetchJson(requestUrl, requestOptions, debug);
    const choice = data?.choices?.[0];
    const completionContent = choice?.message?.content;
    const reasoningContent = choice?.message?.reasoning_content;
    debugLog(debug, 'AI tag completion received', {
        finishReason: choice?.finish_reason || null,
        contentType: typeof completionContent,
        contentLength: typeof completionContent === 'string' ? completionContent.length : null,
        completionContent: typeof completionContent === 'string' ? completionContent : null,
        reasoningContentLength: typeof reasoningContent === 'string' ? reasoningContent.length : null,
        usage: data?.usage || null
    });
    const tags = parseTags(completionContent);
    debugLog(debug, 'AI tag completion parsed', {
        tagCount: tags.length,
        tags
    });
    return tags;
}

async function suggestTags ({ inferenceUrl, apiKey, model, url, title, content, debug }) {
    const requestUrl = `${normalizeInferenceUrl(inferenceUrl)}/chat/completions`;
    const requestOptions = {
        method: 'POST',
        headers: getHeaders(apiKey, true),
        body: JSON.stringify({
            model,
            max_tokens: MAX_COMPLETION_TOKENS,
            thinking_budget_tokens: THINKING_BUDGET_TOKENS,
            messages: [{
                role: 'user',
                content: createPrompt({ url, title, content })
            }]
        })
    };

    try {
        return await requestAndParseTags(requestUrl, requestOptions, debug);
    } catch (error) {
        const isNetworkError = isRetryableNetworkError(error);
        const isMalformedResponse = isMalformedTagResponse(error);
        if (!isNetworkError && !isMalformedResponse) {
            throw error;
        }

        debugLog(debug, 'AI tag suggestion failed; retrying', {
            name: error.name,
            message: error.message,
            reason: isNetworkError ? 'network' : 'malformed-response',
            attempt: 2,
            maxAttempts: 2,
            delayMs: NETWORK_RETRY_DELAY_MS
        });
        await new Promise(resolve => setTimeout(resolve, NETWORK_RETRY_DELAY_MS));
        return requestAndParseTags(requestUrl, requestOptions, debug);
    }
}

export { listAiModels, suggestTags };
