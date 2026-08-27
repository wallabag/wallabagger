"use strict";

import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

class Manifest {
    #availableBrowsers = [
        'chrome',
        'firefox'
    ];
    #targetBrowser;

    constructor() {
        this.#defineTargetBrowser(process.argv.slice(2)[0]);
        this.#build();
    }

    get targetBrowser() {
        return this.#targetBrowser;
    }

    #shared = {
        "name": "Wallabagger",
        "manifest_version": 3,
        "default_locale": "en",
        "version": "1.24.0",
        "description": "__MSG_Extension_description__",
        "icons": {
            "48": "/img/wallabag-icon-48.png",
            "128": "/img/wallabag-icon-128.png"
        },
        "action": {
            "default_title": "Wallabagger",
            "default_icon": "/img/wallabag-icon-48.png",
            "theme_icons": [
                {
                    "dark": "/img/wallabagger.svg",
                    "light": "/img/wallabagger-light.svg",
                    "size": 32
                }
            ],
            "default_popup": "popup.html"
        },
        "background": {
            "type": "module"
        },
        "content_security_policy": {
            "extension_pages": "script-src 'self'"
        },
        "permissions": [
            "storage",
            "contextMenus",
            "activeTab",
            "scripting"
        ],
        "optional_permissions": [
            "tabs"
        ],
        "optional_host_permissions": [
            "*://*/api/*"
        ],
        "options_ui": {
            "page": "options.html",
            "open_in_tab": true
        },
        "commands": {
            "_execute_action": {
                "suggested_key": {
                    "default": "Alt+W",
                    "windows": "Alt+W",
                    "mac": "Alt+W"
                }
            },
            "wallabag-it": {
                "suggested_key": {
                    "default": "Alt+Shift+W",
                    "windows": "Alt+Shift+W",
                    "mac": "Alt+Shift+W"
                },
                "description": "__MSG_Wallabag_it_description__"
            }
        }
    };

    #firefox = () => {
        this.#shared.background.scripts = ["js/background.js"];
        this.#shared.browser_specific_settings = {
            "gecko": {
                "id": "{7a7b1d36-d7a4-481b-92c6-9f5427cb9eb1}",
                "strict_min_version": "128.0",
                "data_collection_permissions": {
                    "required": ["none"]
                }
            },
            "gecko_android": {
                "strict_min_version": "128.0"
            }
        };
        return this.#shared;
    };

    #chrome = () => {
        this.#shared.background.service_worker = "js/background.js";
        this.#shared.minimum_chrome_version = "88";
        return this.#shared;
    };

    #getAvailableBrowsersStr = () => {
        return this.#availableBrowsers.join('|');
    };

    #defineTargetBrowser = (targetBrowser) => {
        if(!targetBrowser) {
            console.error('Missing target browser argument: ' + this.#getAvailableBrowsersStr());
            process.exit();
        }
        this.#targetBrowser = targetBrowser;
    };

    #getManifestContent = () => {
        switch(this.#targetBrowser) {
            case 'chrome':
                return this.#chrome();
            case 'firefox':
                return this.#firefox();
            default:
                console.log('Wrong target browser. Accepted values: ' + this.#getAvailableBrowsersStr());
                process.exit();
        }
    };

    #build = (targetBrowser) => {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        const manifestContent = this.#getManifestContent();
        console.log('targetBrowser: ' + this.#targetBrowser);
        console.dir(manifestContent, { depth: null });
        fs.writeFile(`${__dirname}/../wallabagger/manifest.json`, JSON.stringify(manifestContent, null, "  ") + "\n", () => {});
    };
}

new Manifest();
