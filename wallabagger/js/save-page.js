'use strict';

import { BrowserContentFetch } from './browser-content-fetch/browser-content-fetch.js';

export class SavePage {
    #api = null;
    #browser = null;
    #logger = null;
    #browserUtils = null;
    #savePageToWallabag = null;

    #browserContentFetch = null;

    constructor(api, browser, logger, browserUtils, savePageToWallabag) {
        this.#api = api;
        this.#browser = browser;
        this.#logger = logger;
        this.#browserUtils = browserUtils;
        this.#savePageToWallabag = savePageToWallabag;

        this.#browserContentFetch = new BrowserContentFetch(this.#api, this.#browser, this.#logger, this.#browserUtils);
    }

    handle(action) {
        if(action.type === 'tab' && action.tab) {
            // if in the list to fetch locally
            // if fetch all locally options is set
            // if europresse
            this.#saveTab(action.tab);
        }

        if(action.type === 'url' && action.url) {
            const resetIcon = action.resetIcon ?? false;
            this.#saveUrl(action.url, resetIcon);
        }
    }

    #saveUrl(url, resetIcon) {
        this.#logger.log('save-page url', {url, resetIcon});
        this.#savePageToWallabag(url, resetIcon);
    }

    #saveTab(tab) {
        this.#logger.log('save-page tab', tab);
        this.#browserContentFetch.handle(tab, this.#savePageToWallabag);
    }
}
