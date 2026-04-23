import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SavePage } from '../../wallabagger/js/save-page.js';
import { fakeBrowser, fakeLogger, fakeBrowserUtils, fakeApi } from '../helpers/browser-fake.js';
import { articlePage, normalPage } from '../helpers/page-fake.js';

describe('SavePage', () => {
    let api;
    let browser;
    let logger;
    let browserUtils;
    let savePageToWallabag;
    let savePage;

    beforeEach(() => {
        api = fakeApi();
        browser = fakeBrowser();
        logger = fakeLogger();
        browserUtils = fakeBrowserUtils();
        savePageToWallabag = vi.fn();
        savePage = new SavePage(api, browser, logger, browserUtils, savePageToWallabag);
        globalThis.browser = browser;
    });

    afterEach(() => {
        delete globalThis.browser;
    });

    describe('handle with type "tab" (icon action / popup save)', () => {
        it('fetches content from the tab and saves it', () => {
            const title = 'Example';
            const url = 'https://example.tld';

            const tab = { id: 1, url, title };
            const entryDocumentStr = articlePage();

            savePage.handle({ type: 'tab', tab });
            browser._fireOnMessage({ entryDocumentStr }, { tab: { id: 1 } });

            expect(savePageToWallabag).toHaveBeenCalledOnce();
            const [savedUrl, resetIcon, savedTitle, savedContent] = savePageToWallabag.mock.calls[0];
            expect(savedUrl).toBe(url);
            expect(resetIcon).toBe(false);
            expect(savedTitle).toBe(title);
            expect(savedContent).toContain('<h1>Heading</h1>');
            expect(savedContent).toContain('Page content.');
        });

        it('saves two different tabs with their own content', () => {
            const title1Str = 'Site A';
            const url1Str = 'https://site-a.tld';
            const content1Str = '<p>Article A body.</p>';

            const title2Str = 'Site B';
            const url2Str = 'https://site-b.tld';
            const content2Str = '<p>Article B body.</p>';

            const tab1 = { id: 1, url: url1Str, title: title1Str };
            const tab2 = { id: 2, url: url2Str, title: title2Str };

            savePage.handle({ type: 'tab', tab: tab1 });
            savePage.handle({ type: 'tab', tab: tab2 });

            browser._fireOnMessage(
                { entryDocumentStr: normalPage(content1Str) },
                { tab: { id: 1 } }
            );
            browser._fireOnMessage(
                { entryDocumentStr: normalPage(content2Str) },
                { tab: { id: 2 } }
            );

            expect(savePageToWallabag).toHaveBeenCalledTimes(2);

            const [savedUrl1, , savedTitle1, savedContent1] = savePageToWallabag.mock.calls[0];
            const [savedUrl2, , savedTitle2, savedContent2] = savePageToWallabag.mock.calls[1];

            expect(savedUrl1).toBe(url1Str);
            expect(savedTitle1).toBe(title1Str);
            expect(savedContent1).toContain(content1Str);
            expect(savedContent1).not.toContain(content2Str);

            expect(savedUrl2).toBe(url2Str);
            expect(savedTitle2).toBe(title2Str);
            expect(savedContent2).toContain(content2Str);
            expect(savedContent2).not.toContain(content1Str);
        });
    });

    describe('handle with type "url" (context menu link / keyboard shortcut)', () => {
        it('saves the URL directly without content fetching', () => {
            const url = 'https://link.tld/article';

            savePage.handle({
                type: 'url',
                url,
                resetIcon: true,
            });

            expect(savePageToWallabag).toHaveBeenCalledOnce();
            expect(savePageToWallabag).toHaveBeenCalledWith(url, true);
        });

        it('passes resetIcon=false when not specified', () => {
            const url = 'https://link.tld';

            savePage.handle({ type: 'url', url });

            expect(savePageToWallabag).toHaveBeenCalledWith(url, false);
        });
    });

    describe('handle with type "tab" when the site is not configured for local fetch', () => {
        it('saves the tab URL without fetching content', () => {
            const title = 'Remote Only';
            const url = 'https://remote-only.tld';

            api = fakeApi({ isSiteToFetchLocally: false });
            savePage = new SavePage(api, browser, logger, browserUtils, savePageToWallabag);

            const tab = { id: 1, url, title };

            savePage.handle({ type: 'tab', tab });

            expect(savePageToWallabag).toHaveBeenCalledOnce();
            expect(savePageToWallabag).toHaveBeenCalledWith(url, false);
        });
    });

    describe('handle ignores invalid actions', () => {
        it('does nothing for type "tab" without a tab object', () => {
            savePage.handle({ type: 'tab' });

            expect(savePageToWallabag).not.toHaveBeenCalled();
        });

        it('does nothing for type "url" without a url', () => {
            savePage.handle({ type: 'url' });

            expect(savePageToWallabag).not.toHaveBeenCalled();
        });
    });
});
