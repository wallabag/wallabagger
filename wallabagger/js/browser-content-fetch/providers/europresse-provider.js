'use strict';

import { encodeToBase64 } from '../../utils/sanitize.js';

export class EuropresseProvider {
    #url = 'https://nouveau-europresse-com.bnf.idm.oclc.org/Search';

    isCurrentUrl(url) {
        return url.startsWith(this.#url);
    }

    getPageSelectors() {
        return {
            title: '.titreArticle',
            originUrl: '[name="ophirofox-origin-url"]',
            siteName: '.DocPublicationName'
        };
    }

    getEntry(entryUrl, extracted) {
        const { title, content, originUrl, siteName } = extracted;
        const urlParams = originUrl ?
            `url=${originUrl}` : this.#defaultData(siteName, title);

        return {
            content,
            title,
            url: `${entryUrl}?${urlParams}`,
            originUrl
        };
    }

    #defaultData(siteName, title) {
        // @TODO add an advice to use Ophirofox
        const hashedTitle = `wallabagtitlebase64=${encodeToBase64(title)}`;
        const hashedSiteName = siteName ?
            `wallabagsitenamebase64=${encodeToBase64(siteName)}` : '';
        // Used to create a unique URL for wallabag
        // instead of the same one from Europresse
        return `${hashedTitle}&${hashedSiteName}`;
    }
}
