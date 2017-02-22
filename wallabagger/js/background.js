/* globals WallabagApi */

var CacheType = function (enable) {
    this.enabled = enable;
};

CacheType.prototype = {
    _cache: [],
    enabled: null,

    set: function (key, data) {
        if (this.enabled) {
            this._cache[key] = data;
        }
    },

    clear: function (key, data) {
        if (this.enabled) {
            delete this._cache[key];
        }
    },

    check: function (key, data) {
        return this.enabled && (this._cache[key] !== undefined);
    },

    get: function (key) {
        return this.enabled ? this._cache[key] : undefined;
    }
};

if (typeof (browser) === 'undefined' && typeof (chrome) === 'object') {
    browser = chrome;
}

const icon = {
    'good': 'img/wallabagger-green.svg',
    'wip': 'img/wallabagger-yellow.svg',
    'bad': 'img/wallabagger-red.svg'

};

let browserActionIconDefault = browser.runtime.getManifest().browser_action.default_icon;

const wallabagContextMenus = [
    {
        id: 'wallabagger-add-link',
        title: 'Wallabag it!',
        contexts: ['link', 'page']
    },
    {
        type: 'separator',
        contexts: ['browser_action']
    },
    {
        id: 'unread',
        title: 'Unread articles',
        contexts: ['browser_action']
    },
    {
        id: 'starred',
        title: 'Starred articles',
        contexts: ['browser_action']
    },
    {
        id: 'archive',
        title: 'Archived articles',
        contexts: ['browser_action']
    },
    {
        id: 'all',
        title: 'All articles',
        contexts: ['browser_action']
    },
    {
        id: 'tag',
        title: 'Tag list',
        contexts: ['browser_action']
    }
];

function createContextMenus () {
    wallabagContextMenus.map(menu => { browser.contextMenus.create(menu); });
}

const cache = new CacheType(true); // TODO - here checking option
// const dirtyCache = new CacheType(true);

const api = new WallabagApi();
api.load().then(api => {
    addListeners();
    createContextMenus();
    api.GetTags().then(tags => { cache.set('allTags', tags); });
});

function addListeners () {
    browser.contextMenus.onClicked.addListener(function (info) {
        switch (info.menuItemId) {
            case 'wallabagger-add-link':
                const url = typeof (info.linkUrl) === 'string' ? info.linkUrl : info.pageUrl;
                savePageToWallabag(url);
                break;
            case 'unread':
            case 'starred':
            case 'archive':
            case 'all':
            case 'tag':
                GotoWallabag(info.menuItemId);
                break;
        }
    });
    if (api.data.AllowExistCheck) {
        browser.tabs.onActivated.addListener(function (activeInfo) {
            browser.browserAction.setIcon({ path: browserActionIconDefault });
            const { tabId } = activeInfo;
            browser.tabs.get(tabId, function (tab) {
                checkExist(tab.url);
            });
        });

        browser.tabs.onCreated.addListener(function (tab) {
            browser.browserAction.setIcon({ path: browserActionIconDefault });
        });

        browser.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
            if (changeInfo.status === 'loading' && tab.active) {
                requestExists(tab.url);
            }
        });
    };
    browser.commands.onCommand.addListener(function (command) {
        if (command === 'wallabag-it') {
            browser.tabs.query({ 'active': true }, function (tabs) {
                if (tabs[0] != null) {
                    savePageToWallabag(tabs[0].url);
                }
            });
        }
    });
    browser.runtime.onConnect.addListener(function (port) {
        console.assert(port.name === 'popup');
        port.onMessage.addListener(function (msg) {
            switch (msg.request) {
                case 'save':
                    if (isServicePage(msg.url)) { return; }
                    if (cache.check(btoa(msg.url))) {
                        port.postMessage({ response: 'article', article: cache.get(btoa(msg.url)) });
                    } else {
                        browser.browserAction.setIcon({ path: icon.wip });
                        port.postMessage({ response: 'info', text: 'Saving the page to wallabag ...' });
                        api.SavePage(msg.url)
                        .then(data => {
                            browser.browserAction.setIcon({ path: icon.good });
                            port.postMessage({ response: 'article', article: data });
                            cache.set(btoa(msg.url), data);
                        })
                        .catch(error => {
                            port.postMessage({ response: 'error', error: error });
                            browser.browserAction.setIcon({ path: icon.bad });
                        });
                    }
                    break;
                case 'tags':
                    if (!cache.check('allTags')) {
                        api.GetTags()
                        .then(data => {
                            port.postMessage({ response: 'tags', tags: data });
                            cache.set('allTags', data);
                        })
                        .catch(error => {
                            port.postMessage({ response: 'error', error: error });
                        });
                    } else {
                        port.postMessage({ response: 'tags', tags: cache.get('allTags') });
                    }
                    break;
                case 'saveTitle':
                    api.SaveTitle(msg.articleId, msg.title).then(data => {
                        port.postMessage({ response: 'title', title: data.title });
                        cache.set(btoa(msg.tabUrl), data);
                    }).catch(error => {
                        port.postMessage({ response: 'error', error: error });
                    });
                    break;
                case 'deleteArticle':
                    api.DeleteArticle(msg.articleId).then(data => { cache.clear(msg.tabUrl); })
                    .catch(error => {
                        port.postMessage({ response: 'error', error: error });
                    });
                    break;
                case 'setup':
                    port.postMessage({ response: 'setup', data: api.data });
                    break;
                case 'deleteArticleTag':
                    api.DeleteArticleTag(msg.articleId, msg.tagId).then(data => {
                        port.postMessage({ response: 'articleTags', tags: data.tags });
                        cache.set(btoa(msg.tabUrl), data);
                    }).catch(error => {
                        port.postMessage({ response: 'error', error: error });
                    });
                    break;
                case 'saveTags':
                    api.SaveTags(msg.articleId, msg.tags).then(data => {
                        port.postMessage({ response: 'articleTags', tags: data.tags });
                        cache.set(btoa(msg.tabUrl), data);
                    }).catch(error => {
                        port.postMessage({ response: 'error', error: error });
                    });
                    break;
                case 'SaveStarred':
                case 'SaveArchived':
                    api[msg.request](msg.articleId, msg.value ? 1 : 0).then(data => {
                        port.postMessage({ response: 'action', value: {starred: data.is_starred === 1, archived: data.is_archived === 1} });
                        cache.set(btoa(msg.tabUrl), data);
                    }).catch(error => {
                        port.postMessage({ response: 'error', error: error });
                    });
                    break;
                default: {
                    console.log(`unknown request ${msg}`);
                }
            }
        });
    });
}

function savePageToWallabag (url) {
    browser.browserAction.setIcon({ path: icon.wip });

    api.SavePage(url)
            .then(r => {
                browser.browserAction.setIcon({ path: icon.good });
                setTimeout(function () { browser.browserAction.setIcon({ path: browserActionIconDefault }); }, 5000);
            })
            .catch(e => {
                browser.browserAction.setIcon({ path: icon.bad });
                setTimeout(function () { browser.browserAction.setIcon({ path: browserActionIconDefault }); }, 5000);
            });
};

const GotoWallabag = (part) => browser.tabs.create({ url: `${api.data.Url}/${part}/list` });

const checkExist = (url) => {
    if (isServicePage(url)) { return; }
    existWasChecked(url)
        .then(wasChecked => {
            if (wasChecked) {
                getExistFlag(url)
                .then(exists => {
                    if (exists) {
                        browser.browserAction.setIcon({ path: icon.good });
                    }
                });
            } else {
                requestExists(url);
            }
        });
};

const requestExists = (url) =>
        api.EntryExists(url)
        .then(data => {
            let icon = browserActionIconDefault;
            if (data.exists) {
                icon = icon.good;
            }
            browser.browserAction.setIcon({ path: icon });
            saveExistFlag(url, data.exists);
        });

const saveExistFlag = (url, exists) => {
    browser.storage.local.set({[btoa(url)]: JSON.stringify(exists)});
};

const getExistFlag = (url) =>
        new Promise((resolve, reject) => {
            browser.storage.local.get(btoa(url), function (item) {
                resolve(JSON.parse(item[btoa(url)]));
            });
        });

const existWasChecked = (url) =>
        new Promise((resolve, reject) => {
            browser.storage.local.get(null, function (items) {
                resolve(btoa(url) in items);
            });
        });

const isServicePage = (url) => /^(chrome|about|browser):(.*)/.test(url);

