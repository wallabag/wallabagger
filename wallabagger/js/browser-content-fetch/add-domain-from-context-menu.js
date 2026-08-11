'use strict';

export class AddDomainFromContextMenu {
    localStorageKey = 'popup';
    errorServicePage = 'service-page';
    popupStates = {
        error: 'error',
        ok: 'ok',
        warning: 'warning'

    };

    async addSiteToFetchLocally(api, browser, linkUrl, context, logger) {
        const origin = (new URL(linkUrl)).origin;
        if(context.warning) {
            this.#popupAction(browser, '', {state: this.popupStates.warning, value: this.errorServicePage });
            logger.log('Service page detected:', {linkUrl});
            return;
        }
        try {
            await api.forceInit();
            const sites = api.data.sitesToFetchLocally
                ? new Set(api.data.sitesToFetchLocally.split('\n'))
                : new Set();
            sites.add(origin);
            api.saveParams(Object.assign({}, api.data, { sitesToFetchLocally: [...sites].join('\n') }));
            this.#popupAction(browser, origin, {state: this.popupStates.ok});
            logger.log('Added site to fetch locally:', {origin});
        } catch(error) {
            this.#popupAction(browser, origin, {state: this.popupStates.error});
            logger.log('Failed to add site to fetch locally:', {error, origin});
        }
    };

    cleanup() {
        browser.storage.local.remove(this.localStorageKey);
    }

    #popupAction(browser, domain, context) {
        browser.storage.local.set({ [this.localStorageKey]: {action: 'add-link-white-list', context, domain} });
        browser.action.openPopup();
    }
}
