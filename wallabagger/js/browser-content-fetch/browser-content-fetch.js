'use strict';

import { EuropresseProvider } from './providers/europresse-provider.js';

export class BrowserContentFetch {
    #europresse = new EuropresseProvider();

    #browser = null;
    #port = null;
    #logger = null;
    #browserUtils = null;

    constructor(browser, port, logger, browserUtils) {
        this.#browser = browser;
        this.#port = port;
        this.#logger = logger;
        this.#browserUtils = browserUtils;
    }

    handle(tab) {
        this.#browser.runtime.onMessage.addListener(event => {
            if (typeof event.entryDocumentStr === 'undefined') {
                return;
            }

            const parser = new DOMParser();
            const entryDocument = parser.parseFromString(event.entryDocumentStr, 'text/html');
            const wallabagEntry = this.#getEntry(tab.url, entryDocument);

            const saveEntryMessage = {
                request: 'save',
                tabUrl: wallabagEntry.url,
                proxifiedUrl: wallabagEntry.originUrl ?? null,
                title: wallabagEntry.title ?? tab.title,
                content: wallabagEntry.content ?? null
            };
            this.#logger.log('postMessage', saveEntryMessage);
            this.#port.postMessage(saveEntryMessage);
        });

        const isLocalFetchAction = !this.#browserUtils.isRestrictedPage(tab.url);
        if (isLocalFetchAction) {
            browser.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    // Use of chrome here instead of browser
                    // because of isolated context where
                    // browser is undefined in Chromium-based browsers
                    chrome.runtime.sendMessage({
                        entryDocumentStr: `<html>${window.document.documentElement.innerHTML}</html>`
                    });
                }
            });
        } else {
            this.#port.postMessage({ request: 'save', tabUrl: tab.url });
        }
    }

    #getEntry(url, entryDocument) {
        if(this.#europresse.isCurrentUrl(url)) {
            return this.#europresse.getEntry(url, entryDocument);
        }

        return {
            url,
            content: entryDocument.documentElement.innerHTML,
        };
    }
}
