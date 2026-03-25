'use strict';

export class BrowserReaderMode {
    isInReaderMode (url) {
        return /^about:reader.+/.test(url);
    }

    getUrl(url) {
        return URL.parse(url).searchParams.get('url');
    }
}
