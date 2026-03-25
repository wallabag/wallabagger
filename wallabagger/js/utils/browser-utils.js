'use strict';

import { browser } from '../browser-polyfill.js';
import { BrowserReaderMode } from './browser-reader-mode.js';

class BrowserUtils {
    browserReaderMode = new BrowserReaderMode();

    #firefoxRestrictedPages = [
        'accounts-static.cdn.mozilla.net',
        'accounts.firefox.com',
        'addons.cdn.mozilla.net',
        'addons.mozilla.org',
        'api.accounts.firefox.com',
        'content.cdn.mozilla.net',
        'discovery.addons.mozilla.org',
        'oauth.accounts.firefox.com',
        'profile.accounts.firefox.com',
        'support.mozilla.org',
        'sync.services.mozilla.com'
    ];

    #chromeRestrictedPages = [
        'chromewebstore.google.com'
    ];

    #logger = null;

    constructor (logger) {
        this.#logger = logger;
    }

    isServicePage (url, apiUrl) {
        if(this.browserReaderMode.isInReaderMode(url)) {
            this.#logger.log('isServicePage', 'NO - just in reader mode');
            return false;
        }

        const isServicePageResult = !/^https?:\/\/.+/.test(url) || RegExp('^' + apiUrl).test(url);
        this.#logger.log('isServicePage', isServicePageResult);
        return isServicePageResult;
    };

    isRestrictedPage (url) {
        const hostname = new URL(url).hostname;
        const isRestrictedPageResult = globalThis.wallabaggerBrowser === 'Firefox'
            ? this.#isFirefoxRestrictedPage(url, hostname)
            : this.#chromeRestrictedPages.includes(hostname);
        this.#logger.log('isRestrictedPage', { url, hostname, isRestrictedPageResult });
        return isRestrictedPageResult;
    };

    getActiveTab () {
        return new Promise((resolve, reject) => {
            browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs[0] != null) {
                    return resolve(tabs[0]);
                } else {
                    return reject(new Error('active tab not found'));
                }
            });
        });
    };

    #isFirefoxRestrictedPage (url, hostname) {
        return this.browserReaderMode.isInReaderMode(url) || this.#firefoxRestrictedPages.includes(hostname);
    }
}

export { BrowserUtils };
