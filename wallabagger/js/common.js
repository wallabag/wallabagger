"use strict"

const Common = (() => {
    const translate = (message) => {
        return browser.i18n.getMessage(message);
    };

    const translateAll = () => {
        [].forEach.call(document.querySelectorAll('[data-i18n]'), (el) => {
            const message = el.getAttribute('data-i18n');
            el.textContent = translate(message);
        });
    };

    return {
        'translate': translate,
        'translateAll': translateAll
    }
})();
