'use strict';

import { EuropresseProvider } from './providers/europresse-provider.js';

export class BrowserContentFetch {
    #europresse = new EuropresseProvider();

    getEntry(url, entryDocument) {
        if(this.#europresse.isCurrentUrl(url)) {
            return this.#europresse.getEntry(url, entryDocument);
        }

        return {
            url,
            content: entryDocument.documentElement.innerHTML,
        };
    }
}
