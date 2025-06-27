'use strict';

const browser = (() => {
    globalThis.isChromeBrowser = typeof (globalThis.browser) === 'undefined' && typeof (chrome) === 'object';
    if (globalThis.isChromeBrowser) {
        console.log('Chrome');
        globalThis.wallabaggerBrowser = 'Chrome';
        globalThis.browser = chrome;
        return chrome;
    }

    console.log('Firefox');
    globalThis.wallabaggerBrowser = 'Firefox';
    return globalThis.browser;
})();

export { browser };
