'use strict';

import { Logger } from '../utils/logger.js';

export class FetchLocally {
    localStorageKey = 'popup';
    errorServicePage = 'service-page';
    popupStates = {
        error: 'error',
        ok: 'ok'
    };

    events = {
        name: 'wallabag-fetch-error',
        actions: {
            add: 'add',
            ask: 'ask',
            result: 'result'
        }
    };

    #logger = null;

    constructor() {
        this.#logger = new Logger('fetch-locally');
    }

    async isSiteToFetchLocally (pageUrl) {
        const {wallabagdata} = await browser.storage.local.get('wallabagdata');
        if (wallabagdata.FetchLocallyByDefault) {
            return true;
        }
        if (!wallabagdata.sitesToFetchLocally) {
            return false;
        }
        const sites = wallabagdata.sitesToFetchLocally.split('\n');
        return sites.filter(function (item) {
            return item !== '' && pageUrl.indexOf(item) === 0;
        }).length > 0;
    }

    async addSiteToFetchLocally(url, postMessage) {
        const isAlreadyStored = await this.isSiteToFetchLocally(url);
        if(isAlreadyStored) {
            return;
        }
        try {
            const host = await this.addToList(url);
            this.#popupAction(host, postMessage, {state: this.popupStates.ok});
            this.#logger.log('Added site to fetch locally:', {host});
        } catch(error) {
            this.#popupAction(url, postMessage, {state: this.popupStates.error});
            this.#logger.log('Failed to add site to fetch locally:', {error, url});
        }
    };

    async getSites() {
        const {wallabagdata} = await browser.storage.local.get('wallabagdata');
        if (!wallabagdata || !wallabagdata.sitesToFetchLocally) {
            return new Set();
        }
        this.#logger.log('getSites', {sites: wallabagdata.sitesToFetchLocally.split('\n')});
        return new Set(wallabagdata.sitesToFetchLocally.split('\n'));
    };

    async removeHostFromList(host) {
        const {wallabagdata} = await browser.storage.local.get('wallabagdata');
        const sites = await this.getSites();
        sites.delete(host);
        wallabagdata.sitesToFetchLocally = [...sites].join('\n');
        browser.storage.local.set({ wallabagdata });
    }

    addHostProposal(url, postMessage) {
        // @TODO check if not in the whitelist
        postMessage({ response: this.events.name, action: this.events.actions.ask, url });
    };

    async addToList(url) {
        const host = (new URL(url)).origin;
        const {wallabagdata} = await browser.storage.local.get('wallabagdata');
        const sites = wallabagdata.sitesToFetchLocally
            ? new Set(wallabagdata.sitesToFetchLocally.split('\n'))
            : new Set();
        this.#logger.log('addToList before', {sites});
        sites.add(host);
        wallabagdata.sitesToFetchLocally = [...sites].join('\n');
        wallabagdata.sitesToFetchLocallyLastAdded = host;
        this.#logger.log('addToList after', {sites: wallabagdata.sitesToFetchLocally.split('\n')});
        await browser.storage.local.set({ wallabagdata });
        return host;
    };

    #popupAction(host, postMessage, context) {
        postMessage({ response: this.events.name, action: this.events.actions.result, host, context });
    }
}
