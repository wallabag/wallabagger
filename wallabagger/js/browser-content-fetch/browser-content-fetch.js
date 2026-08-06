'use strict';

import { EuropresseProvider } from './providers/europresse-provider.js';

export class BrowserContentFetch {
    #europresse = new EuropresseProvider();

    #browser = null;
    #logger = null;
    #browserUtils = null;
    #api = null;

    constructor(api, browser, logger, browserUtils) {
        this.#api = api;
        this.#browser = browser;
        this.#logger = logger;
        this.#browserUtils = browserUtils;
    }

    handle(tab, savePageToWallabag) {
        const isEuropresse = this.#europresse.isCurrentUrl(tab.url);

        const listener = (event, sender) => {
            if (typeof event.content === 'undefined') {
                return;
            }

            if (sender?.tab?.id !== tab.id) {
                return;
            }

            this.#browser.runtime.onMessage.removeListener(listener);

            const wallabagEntry = isEuropresse ?
                this.#europresse.getEntry(tab.url, event) :
                { url: tab.url, content: event.content };

            const saveEntryMessage = {
                request: 'save',
                tabUrl: wallabagEntry.url,
                proxifiedUrl: wallabagEntry.originUrl ?? null,
                title: wallabagEntry.title ?? tab.title,
                content: wallabagEntry.content ?? null
            };
            this.#logger.log('postMessage', saveEntryMessage);
            savePageToWallabag(saveEntryMessage.tabUrl, false, saveEntryMessage.title, saveEntryMessage.content, saveEntryMessage.proxifiedUrl);
        };
        this.#browser.runtime.onMessage.addListener(listener);

        const isToFetchLocally = isEuropresse || (!this.#browserUtils.isRestrictedPage(tab.url) && this.#api.isSiteToFetchLocally(tab.url));
        if (isToFetchLocally) {
            browser.scripting.executeScript({
                target: { tabId: tab.id },
                func: (selectors) => {
                    // Use of chrome here instead of browser
                    // because of isolated context where
                    // browser is undefined in Chromium-based browsers
                    const result = {
                        content: `<html>${document.documentElement.innerHTML}</html>`
                    };

                    if (selectors) {
                        result.title = document.querySelector(selectors.title)?.innerText;
                        result.originUrl = document.querySelector(selectors.originUrl)?.content;
                        result.siteName = document.querySelectorAll(selectors.siteName)[0]?.firstChild?.textContent?.trim();
                    }

                    chrome.runtime.sendMessage(result);
                },
                args: [isEuropresse ? this.#europresse.getPageSelectors() : null]
            });
        } else {
            savePageToWallabag(tab.url, false);
        }
    }
}
