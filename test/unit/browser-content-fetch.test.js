import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserContentFetch } from '../../wallabagger/js/browser-content-fetch/browser-content-fetch.js';
import { fakeBrowser, fakeLogger, fakeBrowserUtils, fakeApi } from '../helpers/browser-fake.js';
import { normalPage } from '../helpers/page-fake.js';

describe('BrowserContentFetch', () => {
    let api;
    let browser;
    let logger;
    let browserUtils;
    let browserContentFetch;

    beforeEach(() => {
        api = fakeApi();
        browser = fakeBrowser();
        logger = fakeLogger();
        browserUtils = fakeBrowserUtils();
        browserContentFetch = new BrowserContentFetch(api, browser, logger, browserUtils);
        globalThis.browser = browser;
    });

    afterEach(() => {
        delete globalThis.browser;
    });

    it('forwards the parsed page content for a normal page', () => {
        const title = 'Example';
        const url = 'https://example.tld';
        const contentStr = '<h1>Hello World</h1><p>Body text.</p>';

        const save = vi.fn();
        const tab = { id: 1, url, title };
        const entryDocumentStr = normalPage(`<article>${contentStr}</article>`);

        browserContentFetch.handle(tab, save);
        browser._fireOnMessage({ entryDocumentStr }, { tab: { id: 1 } });

        expect(save).toHaveBeenCalledOnce();
        const [savedUrl, resetIcon, savedTitle, savedContent, savedOriginUrl] = save.mock.calls[0];
        expect(savedUrl).toBe(url);
        expect(resetIcon).toBe(false);
        expect(savedTitle).toBe(title);
        expect(savedContent).toContain(contentStr);
        expect(savedOriginUrl).toBeNull();
    });

    it('falls back to URL-only save for restricted pages', () => {
        const title = 'Addon';
        const url = 'https://addons.mozilla.org/page';

        browserUtils = fakeBrowserUtils({ isRestrictedPage: true });
        browserContentFetch = new BrowserContentFetch(api, browser, logger, browserUtils);

        const save = vi.fn();
        const tab = { id: 1, url, title };

        browserContentFetch.handle(tab, save);

        expect(save).toHaveBeenCalledOnce();
        expect(save).toHaveBeenCalledWith(url, false);
    });

    it('saves correct content per tab when saving 2 pages quickly', () => {
        const title1Str = 'Page 1';
        const url1Str = 'https://page1.tld';
        const content1Str = '<p>Article one body.</p>';

        const title2Str = 'Page 2';
        const url2Str = 'https://page2.tld';
        const content2Str = '<p>Article two body.</p>';

        const save1 = vi.fn();
        const save2 = vi.fn();
        const tab1 = { id: 1, url: url1Str, title: title1Str };
        const tab2 = { id: 2, url: url2Str, title: title2Str };

        browserContentFetch.handle(tab1, save1);
        browserContentFetch.handle(tab2, save2);

        browser._fireOnMessage(
            { entryDocumentStr: normalPage(content1Str) },
            { tab: { id: 1 } }
        );

        expect(save1).toHaveBeenCalledOnce();
        expect(save2).not.toHaveBeenCalled();
        const [savedUrl1, , savedTitle1, savedContent1] = save1.mock.calls[0];
        expect(savedUrl1).toBe(url1Str);
        expect(savedTitle1).toBe(title1Str);
        expect(savedContent1).toContain(content1Str);
        expect(savedContent1).not.toContain(content2Str);

        browser._fireOnMessage(
            { entryDocumentStr: normalPage(content2Str) },
            { tab: { id: 2 } }
        );

        expect(save2).toHaveBeenCalledOnce();
        const [savedUrl2, , savedTitle2, savedContent2] = save2.mock.calls[0];
        expect(savedUrl2).toBe(url2Str);
        expect(savedTitle2).toBe(title2Str);
        expect(savedContent2).toContain(content2Str);
        expect(savedContent2).not.toContain(content1Str);
    });

    it('removes its listener after handling the message', () => {
        const title = 'Example';
        const url = 'https://example.tld';
        const contentStr = '<p>Only content.</p>';

        const save = vi.fn();
        const tab = { id: 1, url, title };

        browserContentFetch.handle(tab, save);
        expect(browser._messageListeners).toHaveLength(1);

        browser._fireOnMessage(
            { entryDocumentStr: normalPage(contentStr) },
            { tab: { id: 1 } }
        );

        expect(browser._messageListeners).toHaveLength(0);
        expect(save.mock.calls[0][3]).toContain(contentStr);
    });

    it('ignores messages without entryDocumentStr', () => {
        const title = 'Example';
        const url = 'https://example.tld';

        const save = vi.fn();
        const tab = { id: 1, url, title };

        browserContentFetch.handle(tab, save);

        browser._fireOnMessage(
            { someOtherEvent: true },
            { tab: { id: 1 } }
        );

        expect(save).not.toHaveBeenCalled();
        expect(browser._messageListeners).toHaveLength(1);
    });

    describe('isSiteToFetchLocally gating', () => {
        it('falls back to URL-only save when the site is not configured for local fetch', () => {
            const title = 'Example';
            const url = 'https://example.tld';

            api = fakeApi({ isSiteToFetchLocally: false });
            browserContentFetch = new BrowserContentFetch(api, browser, logger, browserUtils);

            const save = vi.fn();
            const tab = { id: 1, url, title };

            browserContentFetch.handle(tab, save);

            expect(save).toHaveBeenCalledOnce();
            expect(save).toHaveBeenCalledWith(url, false);
        });

        it('forwards the fetched page content when the site is configured for local fetch', () => {
            const title = 'Example';
            const url = 'https://example.tld';
            const contentStr = '<article>Locally fetched body.</article>';

            const save = vi.fn();
            const tab = { id: 1, url, title };
            const entryDocumentStr = normalPage(contentStr);

            browserContentFetch.handle(tab, save);
            browser._fireOnMessage({ entryDocumentStr }, { tab: { id: 1 } });

            expect(save).toHaveBeenCalledOnce();
            const [savedUrl, resetIcon, savedTitle, savedContent] = save.mock.calls[0];
            expect(savedUrl).toBe(url);
            expect(resetIcon).toBe(false);
            expect(savedTitle).toBe(title);
            expect(savedContent).toContain(contentStr);
        });

        it('skips the local fetch for restricted pages even when the site is configured for local fetch', () => {
            const title = 'Restricted';
            const url = 'about:addons';

            browserUtils = fakeBrowserUtils({ isRestrictedPage: true });
            api = fakeApi({ isSiteToFetchLocally: true });
            browserContentFetch = new BrowserContentFetch(api, browser, logger, browserUtils);

            const save = vi.fn();
            const tab = { id: 1, url, title };

            browserContentFetch.handle(tab, save);

            expect(save).toHaveBeenCalledOnce();
            expect(save).toHaveBeenCalledWith(url, false);
        });
    });
});
