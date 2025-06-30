'use strict';

const browser = (() => {
    globalThis.isChromeBrowser = typeof (globalThis.browser) === 'undefined' && typeof (chrome) === 'object';
    if (globalThis.isChromeBrowser) {
        globalThis.wallabaggerBrowser = 'Chrome';
        globalThis.browser = chrome;
        return chrome;
    }

    globalThis.wallabaggerBrowser = 'Firefox';
    return globalThis.browser;
})();

export { browser };
