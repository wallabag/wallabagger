//* globals WallabagApi */

// declarations


let Port = null;
let portConnected = false;

const CacheType = function (enable) {
    this.enabled = enable;
    this._cache = [];
};

CacheType.prototype = {
    _cache: null,
    enabled: false,

    str: function (some) {
        return btoa(unescape(encodeURIComponent(some)));
    },

    set: function (key, data) {
        if (this.enabled) {
            this._cache[this.str(key)] = data;
        }
    },

    clear: function (key) {
        if (this.enabled) {
            delete this._cache[this.str(key)];
        }
    },

    check: function (key) {
        return this.enabled && (this._cache[this.str(key)] !== undefined);
    },

    get: function (key) {
        return this.enabled ? this._cache[this.str(key)] : undefined;
    }
};

const wallabagContextMenus = [
    {
        id: 'wallabagger-add-link',
        title: Common.translate('Wallabag_it'),
        contexts: ['link', 'page']
    },
    {
        type: 'separator',
        contexts: ['browser_action']
    },
    {
        id: 'unread',
        title: Common.translate('Unread'),
        contexts: ['browser_action']
    },
    {
        id: 'starred',
        title: Common.translate('Starred'),
        contexts: ['browser_action']
    },
    {
        id: 'archive',
        title: Common.translate('Archive'),
        contexts: ['browser_action']
    },
    {
        id: 'all',
        title: Common.translate('All_entries'),
        contexts: ['browser_action']
    },
    {
        id: 'tag',
        title: Common.translate('Tags'),
        contexts: ['browser_action']
    }
];

const existStates = {
    exists: 'exists',
    notexists: 'notexists',
    wip: 'wip'
};

const cache = new CacheType(true); // TODO - here checking option
const dirtyCache = new CacheType(true);
const existCache = new CacheType(true);

const api = new WallabagApi();

// Code

const version = chrome.runtime.getManifest().version.split('.');
version.length === 4 && chrome.browserAction.setBadgeText({ text: 'ß' });

api.init().then(data => {
    addExistCheckListeners(api.data.AllowExistCheck);
    api.GetTags().then(tags => { cache.set('allTags', tags); });
});

addListeners();
createContextMenus();

// Functions
function createContextMenus () {
    wallabagContextMenus.map(menu => chrome.contextMenus.create(menu));
}

function onTabActivatedListener (activeInfo) {
    browserIcon.set('default');
    const { tabId } = activeInfo;
    chrome.tabs.get(tabId, function (tab) {
        if (tab.incognito) {
            return;
        }
        checkExist(tab.url);
    });
}

function onTabCreatedListener (tab) {
    browserIcon.set('default');
}

function onTabUpdatedListener (tabId, changeInfo, tab) {
    if (tab.incognito) {
        return;
    }
    if ((changeInfo.status === 'loading') && tab.active) {
        checkExist(tab.url);
    }
}

function addExistCheckListeners (enable) {
    if (enable === true) {
        chrome.tabs.onActivated.addListener(onTabActivatedListener);
        chrome.tabs.onCreated.addListener(onTabCreatedListener);
        chrome.tabs.onUpdated.addListener(onTabUpdatedListener);
    } else {
        if (chrome.tabs && chrome.tabs.onActivated.hasListener(onTabActivatedListener)) {
            chrome.tabs.onActivated.removeListener(onTabActivatedListener);
        }
        if (chrome.tabs && chrome.tabs.onCreated.hasListener(onTabCreatedListener)) {
            chrome.tabs.onCreated.removeListener(onTabCreatedListener);
        }
        if (chrome.tabs && chrome.tabs.onUpdated.hasListener(onTabUpdatedListener)) {
            chrome.tabs.onUpdated.removeListener(onTabUpdatedListener);
        }
    }
}

function goToOptionsPage (optionsPageUrl, res) {
    if (typeof (res) === 'undefined' || res.length === 0) {
        chrome.tabs.create({
            url: optionsPageUrl
        });
    } else {
        chrome.tabs.update(res[0].id, { active: true });
    }
}

function openOptionsPage () {
    postIfConnected({ response: 'close' });
    const optionsPageUrlFromManifest = chrome.runtime.getManifest().options_ui.page;
    const optionsPageUrl = chrome.runtime.getURL(optionsPageUrlFromManifest);
    try {
        chrome.tabs.query({ url: optionsPageUrl }).then(res => goToOptionsPage(optionsPageUrl, res));
    } catch (e) {
        // @Opera
        chrome.tabs.query({ url: optionsPageUrl }, function (res) {
            goToOptionsPage(optionsPageUrl, res);
        });
    }
}

function onContextMenusClicked (info) {
    switch (info.menuItemId) {
        case 'wallabagger-add-link':
            if (typeof (info.linkUrl) === 'string' && info.linkUrl.length > 0) {
                savePageToWallabag(info.linkUrl, true);
            } else {
                savePageToWallabag(info.pageUrl, false);
            }
            break;
        case 'unread':
        case 'starred':
        case 'archive':
        case 'all':
        case 'tag':
            GotoWallabag(info.menuItemId);
            break;
    }
}

function onCommandsCommand (command) {
    if (command === 'wallabag-it') {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0] != null) {
                savePageToWallabag(tabs[0].url, false);
            }
        });
    }
}

function postIfConnected (obj) {
    portConnected && Port.postMessage(obj);
    api.data.Debug && console.log(`postMessage: ${JSON.stringify(obj)}`);
}
function onPortMessage (msg) {
    try {
        switch (msg.request) {
            case 'save':
                savePageToWallabag(msg.tabUrl, false, msg.title, msg.content);
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
                        cache.set(msg.tabUrl, cutArticle(data));
                    });
                } else {
                    dirtyCacheSet(msg.tabUrl, { title: msg.title });
                }
                break;
            case 'deleteArticle':
                if (msg.articleId !== -1) {
                    api.DeleteArticle(msg.articleId).then(data => {
                        cache.clear(msg.tabUrl);
                    });
                } else {
                    dirtyCacheSet(msg.tabUrl, { deleted: true });
                }
                browserIcon.set('default');
                saveExistFlag(msg.tabUrl, existStates.notexists);
                break;
            case 'setup':
                if (!api.checkParams()) {
                    postIfConnected({ response: 'error', error: { message: Common.translate('Options_not_defined') } });
                }
                postIfConnected({ response: 'setup', data: api.data });
                break;
            case 'setup-open':
                openOptionsPage();
                break;
            case 'setup-save':
                api.setsave(msg.data);
                postIfConnected({ response: 'setup-save', data: api.data });
                addExistCheckListeners(msg.data.AllowExistCheck);
                break;
            case 'setup-gettoken':
                api.setsave(msg.data);
                api.PasswordToken()
                    .then(a => {
                        postIfConnected({ response: 'setup-gettoken', data: api.data, result: true });
                        if (!cache.check('allTags')) {
                            api.GetTags()
                                .then(data => { cache.set('allTags', data); });
                        }
                    })
                    .catch(a => {
                        postIfConnected({ response: 'setup-gettoken', data: api.data, result: false });
                    });
                break;
            case 'setup-checkurl':
                api.setsave(msg.data);
                api.CheckUrl()
                    .then(a => {
                        postIfConnected({ response: 'setup-checkurl', data: api.data, result: true });
                    })
                    .catch(a => {
                        api.clear();
                        postIfConnected({ response: 'setup-checkurl', data: api.data, result: false });
                    });
                break;
            case 'deleteArticleTag':
                if (msg.articleId !== -1) {
                    api.DeleteArticleTag(msg.articleId, msg.tagId).then(data => {
                        postIfConnected({ response: 'articleTags', tags: data.tags });
                        cache.set(msg.tabUrl, cutArticle(data));
                    });
                } else {
                    dirtyCacheSet(msg.tabUrl, { tagList: msg.tags });
                }
                break;
            case 'saveTags':
                if (msg.articleId !== -1) {
                    api.SaveTags(msg.articleId, msg.tags).then(data => {
                        postIfConnected({ response: 'articleTags', tags: data.tags });
                        cache.set(msg.tabUrl, cutArticle(data));
                        return data;
                    })
                        .then(data => {
                            addToAllTags(data.tags);
                        });
                } else {
                    addDirtyToAllTags(msg.tags);
                    dirtyCacheSet(msg.tabUrl, { tagList: msg.tags });
                }
                break;
            case 'SaveStarred':
            case 'SaveArchived':
                if (msg.articleId !== -1) {
                    api[msg.request](msg.articleId, msg.value ? 1 : 0).then(data => {
                        postIfConnected({ response: 'action', value: { starred: data.is_starred, archived: data.is_archived } });
                        cache.set(msg.tabUrl, cutArticle(data));
                    });
                } else {
                    dirtyCacheSet(msg.tabUrl, (msg.request === 'SaveStarred') ? { is_starred: msg.value } : { is_archived: msg.value });
                }
                break;
            default: {
                console.log(`unknown request ${JSON.stringify(msg)}`);
            }
        }
    } catch (error) {
        browserIcon.setTimed('bad');
        postIfConnected({ response: 'error', error: error });
    }
}

function onRuntimeConnect (port) {
    Port = port;
    portConnected = true;

    Port.onDisconnect.addListener(function () { portConnected = false; });
    Port.onMessage.addListener(onPortMessage);
}

function onRuntimeInstalled (details) {
    if (details.reason === 'install') {
        openOptionsPage();
    }
    if (details.reason === 'update' && api.data.isFetchPermissionGranted !== true) {
        openOptionsPage();
    }
}

function addListeners () {
    chrome.contextMenus.onClicked.addListener(onContextMenusClicked);
    chrome.commands.onCommand.addListener(onCommandsCommand);
    chrome.runtime.onConnect.addListener(onRuntimeConnect);
    chrome.runtime.onInstalled.addListener(onRuntimeInstalled);
}

const browserIcon = {
    images: {
        default: chrome.runtime.getManifest().browser_action.default_icon,
        good: 'img/wallabagger-green.svg',
        wip: 'img/wallabagger-yellow.svg',
        bad: 'img/wallabagger-red.svg'
    },

    timedToDefault: function () {
        setTimeout(() => {
            this.set('default');
        }, 5000);
    },

    set: function (icon) {
        if (icon === 'default') {
            // On Firefox, we want to reset to the default icon suitable for the active theme
            // but Chromium does not support resetting icons.
            try {
                chrome.browserAction.setIcon({ path: null });

                return;
            } catch {
                // Chromium does not support themed icons either,
                // so let’s just fall back to the default icon.
            }
        }

        chrome.browserAction.setIcon({ path: this.images[icon] });
    },

    setTimed: function (icon) {
        this.set(icon);
        this.timedToDefault();
    }
};

function dirtyCacheSet (key, obj) {
    dirtyCache.set(key, Object.assign(dirtyCache.check(key) ? dirtyCache.get(key) : {}, obj));
    dirtyCache.set(key, Object.assign(dirtyCache.check(key) ? dirtyCache.get(key) : {}, { id: -1, url: key }));
}

function applyDirtyCacheLight (key, data) {
    if (dirtyCache.check(key)) {
        const dirtyObject = dirtyCache.get(key);
        if (!dirtyObject.deleted) {
            if ((dirtyObject.title !== undefined) || (dirtyObject.is_archived !== undefined) ||
                (dirtyObject.is_starred !== undefined) || (dirtyObject.tagList !== undefined)) {
                data.changed = true;
            }
            data.title = dirtyObject.title !== undefined ? dirtyObject.title : data.title;
            data.is_archived = dirtyObject.is_archived !== undefined ? dirtyObject.is_archived : data.is_archived;
            data.is_starred = dirtyObject.is_starred !== undefined ? dirtyObject.is_starred : data.is_starred;
            data.tagList =
            (dirtyObject.tagList !== undefined ? dirtyObject.tagList.split(',') : [])
                .concat(data.tags.map(t => t.label))
                .filter((v, i, a) => a.indexOf(v) === i)
                .join(',');
        } else {
            data.deleted = true;
        }
    }
    return data;
}

function applyDirtyCacheReal (key, data) {
    if (dirtyCache.check(key)) {
        const dirtyObject = dirtyCache.get(key);
        if (dirtyObject.deleted !== undefined) {
            return api.DeleteArticle(data.id).then(a => { dirtyCache.clear(key); });
        } else {
            if (data.changed !== undefined) {
                return api.PatchArticle(data.id, { title: data.title, starred: data.is_starred, archive: data.is_archived, tags: data.tagList })
                    .then(data => cache.set(key, cutArticle(data)))
                    .then(a => { dirtyCache.clear(key); });
            }
        }
    }
    return data;
}
function cutArticle (data) {
    return Object.assign({}, {
        id: data.id,
        is_starred: data.is_starred,
        is_archived: data.is_archived,
        title: data.title,
        url: data.url,
        tags: data.tags,
        domain_name: data.domain_name,
        preview_picture: data.preview_picture
    });
}

function moveToDirtyCache (url) {
    if (cache.check(url)) {
        const art = cache.get(url);
        // api.data.Debug && console.log(`article to move to dirtyCache ${JSON.stringify(art)}`);
        dirtyCacheSet(url, {
            title: art.title,
            tagList: art.tags.map(tag => tag.label).join(','),
            is_archived: art.is_archived,
            is_starred: art.is_starred
        });
        cache.clear(url);
    }
}

function savePageToWallabag (url, resetIcon, title, content) {
    if (isServicePage(url)) {
        return;
    }
    if (api.checkParams() === false) {
        openOptionsPage();
        return false;
    }
    // if WIP and was some dirty changes, return dirtyCache
    const exists = existCache.check(url) ? existCache.get(url) : existStates.notexists;
    const isToFetchLocally = api.IsSiteToFetchLocally(url);
    if (exists === existStates.wip) {
        if (dirtyCache.check(url)) {
            const dc = dirtyCache.get(url);
            postIfConnected({ response: 'article', article: cutArticle(dc) });
        }
        return;
    }

    // if article was saved, return cache
    if (!isToFetchLocally && cache.check(url)) {
        postIfConnected({ response: 'article', article: cutArticle(cache.get(url)) });
        moveToDirtyCache(url);
        savePageToWallabag(url, resetIcon);
        return;
    }

    // real saving
    browserIcon.set('wip');
    existCache.set(url, existStates.wip);
    postIfConnected({ response: 'info', text: Common.translate('Saving_the_page_to_wallabag') });

    const savePageOptions = {
        url: url
    };

    if (isToFetchLocally) {
        savePageOptions.title = title;
        savePageOptions.content = content;
    }

    const promise = api.SavePage(savePageOptions);
    promise
        .then(data => applyDirtyCacheLight(url, data))
        .then(data => {
            if (!data.deleted) {
                browserIcon.set('good');
                postIfConnected({ response: 'article', article: cutArticle(data) });
                cache.set(url, cutArticle(data));
                saveExistFlag(url, existStates.exists);
                if (api.data.AllowExistCheck !== true || resetIcon) {
                    browserIcon.timedToDefault();
                }
            } else {
                cache.clear(url);
            }
            return data;
        })
        .then(data => applyDirtyCacheReal(url, data))
        .catch(error => {
            browserIcon.setTimed('bad');
            saveExistFlag(url, existStates.notexists);
            postIfConnected({ response: 'error', error: { message: Common.translate('Save_Error') } });
            throw error;
        });
};

const GotoWallabag = (part) => api.checkParams() && chrome.tabs.create({ url: `${api.data.Url}/${part}/list` });

const checkExist = (dirtyUrl) => {
    if (isServicePage(dirtyUrl)) { return; }
    const url = dirtyUrl.split('#')[0];
    if (existCache.check(url)) {
        const existsFlag = existCache.get(url);
        if (existsFlag === existStates.exists) {
            browserIcon.set('good');
        }
        if (existsFlag === existStates.wip) {
            browserIcon.set('wip');
        }
    } else {
        requestExists(url);
    }
};

const requestExists = (url) =>
    api.EntryExists(url)
        .then(data => {
            let icon = 'default';
            if (data.exists) {
                icon = 'good';
                if (api.data.AllowExistCheck !== true) {
                    browserIcon.setTimed(icon);
                }
            }
            browserIcon.set(icon);
            saveExistFlag(url, data.exists ? existStates.exists : existStates.notexists);
            return data.exists;
        });

const saveExistFlag = (url, exists) => {
    existCache.set(url, exists);
};

const isServicePage = (url) => !/^https?:\/\/.+/.test(url) || RegExp('^' + api.data.Url).test(url);

const addToAllTags = (tags) => {
    if (tags.length === 0) { return; }
    if (!cache.check('allTags')) {
        cache.set('allTags', tags);
    } else {
        const allTags = cache.get('allTags');
        for (const tag of tags) {
            const index = allTags.map(t => t.label).indexOf(tag.label);
            if (index === -1) {
                // add new tags
                allTags.push(tag);
            } else if ((tag.id > 0) && (allTags[index].id < 0)) {
                // replace dirty tags by clean ones
                allTags.splice(index, 1, tag);
            }
        };
        cache.set('allTags', allTags);
    }
};

const addDirtyToAllTags = (tagList) => {
    if (!tagList || tagList === '') { return; }
    let dirtyId = -1;
    const dirtyTags = tagList.split(',').map(label => Object.assign({}, { id: dirtyId--, label: label, slug: label }));
    addToAllTags(dirtyTags);
};
