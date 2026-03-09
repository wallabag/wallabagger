'use strict';

import { Cache } from './cache.js';

class ExistingUrl {
    cache = new Cache(true);

    #api = null;
    #browser = null;
    #browserIcon = null;
    #browserUtils = null;
    #logger = null;

    states = {
        exists: 'exists',
        notexists: 'notexists',
        wip: 'wip'
    };

    constructor (api, browser, browserIcon, browserUtils, logger) {
        this.#api = api;
        this.#browser = browser;
        this.#browserIcon = browserIcon;
        this.#browserUtils = browserUtils;
        this.#logger = logger;
    }

    checkExist (dirtyUrl) {
        if (this.#browserUtils.isServicePage(dirtyUrl, this.#api.data.Url)) { return; }
        const url = dirtyUrl.split('#')[0];
        if (this.cache.check(url)) {
            const existsFlag = this.cache.get(url);
            if (existsFlag === this.states.exists) {
                this.#browserIcon.set('good');
            }
            if (existsFlag === this.states.wip) {
                this.#browserIcon.set('wip');
            }
        } else {
            this.#requestExists(url);
        }
    }

    saveExistFlag (url, exists) {
        this.cache.set(url, exists);
    }

    addListeners (enable) {
        this.#logger.groupCollapsed('addExistCheckListeners');
        this.#logger.log('starting');
        if (enable === true) {
            this.#browser.tabs.onActivated.addListener(this.#onTabActivatedListener.bind(this));
            this.#browser.tabs.onCreated.addListener(this.#onTabCreatedListener.bind(this));
            this.#browser.tabs.onUpdated.addListener(this.#onTabUpdatedListener.bind(this));
        } else {
            if (this.#browser.tabs && this.#browser.tabs.onActivated.hasListener(this.#onTabActivatedListener)) {
                this.#browser.tabs.onActivated.removeListener(this.#onTabActivatedListener);
            }
            if (this.#browser.tabs && this.#browser.tabs.onCreated.hasListener(this.#onTabCreatedListener)) {
                this.#browser.tabs.onCreated.removeListener(this.#onTabCreatedListener);
            }
            if (this.#browser.tabs && this.#browser.tabs.onUpdated.hasListener(this.#onTabUpdatedListener)) {
                this.#browser.tabs.onUpdated.removeListener(this.#onTabUpdatedListener);
            }
        }
        this.#logger.log('ending');
        this.#logger.groupEnd();
    }

    #onTabActivatedListener (activeInfo) {
        this.#browserIcon.set('default');
        const { tabId } = activeInfo;
        this.#browser.tabs.get(tabId, (tab) => {
            if (tab.incognito) {
                return;
            }
            this.checkExist(tab.url);
        });
    }

    #onTabCreatedListener () {
        this.#browserIcon.set('default');
    }

    #onTabUpdatedListener (tabId, changeInfo, tab) {
        if (tab.incognito) {
            return;
        }
        if ((changeInfo.status === 'loading') && tab.active) {
            this.checkExist(tab.url);
        }
    }

    async #requestExists (url) {
        const data = await this.#api.entryExists(url);
        let icon = 'default';
        if (data.exists) {
            icon = 'good';
            if (this.#api.data.AllowExistCheck !== true) {
                this.#browserIcon.setTimed(icon);
            }
        }
        this.#browserIcon.set(icon);
        this.saveExistFlag(url, data.exists ? this.states.exists : this.states.notexists);
        return data.exists;
    }
}

export { ExistingUrl };
