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

    clear: function (key) {
        if (this.enabled) {
            delete this._cache[key];
        }
    },

    check: function (key) {
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
const dirtyCache = new CacheType(true);

const api = new WallabagApi();
api.init().then(api => {
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
        let portConnected = true;
        port.onDisconnect.addListener(function () { portConnected = false; });
        function postIfConnected (obj) {
            if (portConnected) {
                port.postMessage(obj);
            }
        }
        port.onMessage.addListener(function (msg) {
            try {
                switch (msg.request) {
                    case 'save':
                        if (isServicePage(msg.url)) { return; }
                        if (cache.check(btoa(msg.url))) {
                            postIfConnected({ response: 'article', article: cache.get(btoa(msg.url)) });
                        } else {
                            browser.browserAction.setIcon({ path: icon.wip });
                            postIfConnected({ response: 'info', text: 'Saving the page to wallabag ...' });
                            api.SavePage(msg.url)
                            .then(data => portConnected ? applyDirtyCacheLight(msg.url, data) : data)
                            .then(data => {
                                browser.browserAction.setIcon({ path: icon.good });
                                postIfConnected({ response: 'article', article: data });
                                cache.set(btoa(msg.url), data);
                                return data;
                            })
                            .then(data => applyDirtyCacheReal(msg.url, data))
                            .catch(error => {
                                browser.browserAction.setIcon({ path: icon.bad });
                                throw error;
                            });
                        }
                        break;
                    case 'tags':
                        if (!cache.check('allTags')) {
                            api.GetTags()
                            .then(data => {
                                postIfConnected({ response: 'tags', tags: data });
                                cache.set('allTags', data);
                            });
                        } else {
                            postIfConnected({ response: 'tags', tags: cache.get('allTags') });
                        }
                        break;
                    case 'saveTitle':
                        if (msg.articleId !== -1) {
                            api.SaveTitle(msg.articleId, msg.title).then(data => {
                                postIfConnected({ response: 'title', title: data.title });
                                cache.set(btoa(msg.tabUrl), data);
                            });
                        } else {
                            dirtyCacheSet(btoa(msg.tabUrl), {title: msg.title});
                        }
                        break;
                    case 'deleteArticle':
                        if (msg.articleId !== -1) {
                            api.DeleteArticle(msg.articleId).then(data => { cache.clear(msg.tabUrl); });
                        } else {
                            dirtyCacheSet(btoa(msg.tabUrl), {deleted: true});
                        }
                        break;
                    case 'setup':
                        postIfConnected({ response: 'setup', data: api.data });
                        break;
                    case 'deleteArticleTag':
                        if (msg.articleId !== -1) {
                            api.DeleteArticleTag(msg.articleId, msg.tagId).then(data => {
                                postIfConnected({ response: 'articleTags', tags: data.tags });
                                cache.set(btoa(msg.tabUrl), data);
                            });
                        } else {
                            dirtyCacheSet(btoa(msg.tabUrl), {tags: msg.tags});
                        }
                        break;
                    case 'saveTags':
                        if (msg.articleId !== -1) {
                            api.SaveTags(msg.articleId, msg.tags).then(data => {
                                postIfConnected({ response: 'articleTags', tags: data.tags });
                                cache.set(btoa(msg.tabUrl), data);
                            });
                        } else {
                            dirtyCacheSet(btoa(msg.tabUrl), {tags: msg.tags});
                        }
                        break;
                    case 'SaveStarred':
                    case 'SaveArchived':
                        if (msg.articleId !== -1) {
                            api[msg.request](msg.articleId, msg.value ? 1 : 0).then(data => {
                                postIfConnected({ response: 'action', value: {starred: data.is_starred === 1, archived: data.is_archived === 1} });
                                cache.set(btoa(msg.tabUrl), data);
                            });
                        } else {
                            dirtyCacheSet(btoa(msg.tabUrl), (msg.request === 'SaveStarred') ? {is_starred: msg.value ? 1 : 0} : {is_archived: msg.value ? 1 : 0});
                        }
                        break;
                    default: {
                        console.log(`unknown request ${msg}`);
                    }
                }
            } catch (error) {
                postIfConnected({ response: 'error', error: error });
            }
        });
    });
}

function dirtyCacheSet (key, obj) {
    dirtyCache.set(Object.assign(dirtyCache.check(key) ? dirtyCache.get(key) : {}, obj));
}

function applyDirtyCacheLight (key, data) {
    if (dirtyCache.check(key)) {
        const dirtyObject = dirtyCache.get(key);
        data.title = dirtyObject.title !== undefined ? dirtyObject.title : data.title;
        data.is_archived = dirtyObject.is_archived !== undefined ? dirtyObject.is_archived : data.is_archived;
        data.is_starred = dirtyObject.is_starred !== undefined ? dirtyObject.is_starred : data.is_starred;
        data.tagList = (dirtyObject.tags !== undefined ? dirtyObject.tags.split(',') : []).concat(data.tags.map(t => t.label)).unique().join(',');
    }
    return data;
}

function applyDirtyCacheReal (key, data) {
    if (dirtyCache.check(key)) {
        const dirtyObject = dirtyCache.get(key);
        if (dirtyObject.deleted !== undefined) {
            return api.DeleteArticle(data.id);
        } else {
            return api.PatchArticle(data.id, { title: data.title, starred: data.is_starred, archive: data.is_archived, tags: data.tagList });
        }
    }
    return data;
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

