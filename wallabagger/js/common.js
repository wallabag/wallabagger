/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "Common" }] */
'use strict';

const Common = (() => {
    const translate = (key) => {
        const message = browser.i18n.getMessage(key);
        return message || `[TODO] ${key}`;
    };

    const translateAll = () => {
        [].forEach.call(document.querySelectorAll('[data-i18n]'), (el) => {
            const message = el.getAttribute('data-i18n');
            el.textContent = translate(message);
        });
        [].forEach.call(document.querySelectorAll('[data-i18n-attr]'), (el) => {
            const [attr, message] = el.getAttribute('data-i18n-attr').split('|');
            el.setAttribute(attr, translate(message));
        });
    };

    const getLocale = () => browser.i18n.getUILanguage();

    return {
        translate: translate,
        translateAll: translateAll,
        getLocale: getLocale
    };
})();
