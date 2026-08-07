'use strict';

export class AddDomainFromContextMenu {
    localStorageKey = 'popup';

    async addSiteToFetchLocally(api, browser, linkUrl, logger) {
        const origin = (new URL(linkUrl)).origin;
        try {
            await api.forceInit();
            const sites = api.data.sitesToFetchLocally
                ? new Set(api.data.sitesToFetchLocally.split('\n'))
                : new Set();
            sites.add(origin);
            api.saveParams(Object.assign({}, api.data, { sitesToFetchLocally: [...sites].join('\n') }));
            this.#popupAction(browser, origin, true);
            logger.log('Added site to fetch locally:', {origin});
        } catch(error) {
            this.#popupAction(browser, origin, false);
            logger.log('Failed to add site to fetch locally:', {error, origin});
        }
    };

    cleanup() {
        browser.storage.local.remove(this.localStorageKey);
    }

    #popupAction(browser, domain, state) {
        browser.storage.local.set({ [this.localStorageKey]: {action: 'add-link-white-list', state, value: domain} });
        browser.action.openPopup();
    }
}
