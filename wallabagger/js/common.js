"use strict"

window.Common = {
    translateAll: () => {
        [].forEach.call(document.querySelectorAll('[data-i18n]'), (el) => {
            const message = el.getAttribute('data-i18n');
            el.textContent = browser.i18n.getMessage(message);
        });
    }
};
