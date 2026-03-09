'use strict';

const imageExtension = globalThis.wallabaggerBrowser ? 'png' : 'svg';
class BrowserIcon {
    images = {
        default: browser.runtime.getManifest().action.default_icon,
        good: '/img/wallabagger-green.' + imageExtension,
        wip: '/img/wallabagger-yellow.' + imageExtension,
        bad: '/img/wallabagger-red.' + imageExtension
    };

    #browser = null;

    constructor (browser) {
        this.#browser = browser;
    }

    timedToDefault () {
        setTimeout(() => {
            this.set('default');
        }, 5000);
    }

    set (icon) {
        if (icon === 'default') {
            // On Firefox, we want to reset to the default icon suitable for the active theme
            // but Chromium does not support resetting icons.
            try {
                this.#browser.action.setIcon({ path: null });

                return;
            } catch {
                // Chromium does not support themed icons either,
                // so let’s just fall back to the default icon.
            }
        }

        this.#browser.action.setIcon({ path: this.images[icon] });
    }

    setTimed (icon) {
        this.set(icon);
        this.timedToDefault();
    }
};

export { BrowserIcon };
