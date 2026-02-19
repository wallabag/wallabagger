import { browser } from './browser-polyfill.js';
import { Common } from './common.js';
import { WallabagApi } from './wallabag-api.js';
import { PortManager } from './port-manager.js';
import { BrowserUtils } from './utils/browser-utils.js';
import { Logger } from './utils/logger.js';
import { Cache } from './utils/cache.js';
import { ExistingUrl } from './utils/existing-url.js';
import { BrowserIcon } from './utils/browser-icon.js';

import { SavePage } from './save-page.js';

const logger = new Logger('background');
const api = new WallabagApi(logger);
const browserIcon = new BrowserIcon(browser);
const browserUtils = new BrowserUtils(logger);
const existingUrl = new ExistingUrl(api, browser, browserIcon, browserUtils, logger);

let Port = null;
let portConnected = false;

const savePage = new SavePage(browser, logger, browserUtils, savePageToWallabag);

const wallabaggerAddLinkContexts = ['link', 'page'];
if (!globalThis.wallabaggerBrowser) {
    wallabaggerAddLinkContexts.push('tab');
}


const cache = new Cache(true); // TODO - here checking option
const dirtyCache = new Cache(true);

const isBetaVersion = browser.runtime.getManifest().version.split('.').length === 4;
if (isBetaVersion) {
    browser.action.setBadgeText({ text: 'ß' });
}

const addListeners = () => {
    logger.groupCollapsed('addListeners');
    logger.log('starting');

    if(browser.contextMenus !== undefined) {
        logger.log('adding onClicked listener');
        browser.contextMenus.onClicked.addListener(async (info) => {
            await api.forceInit();
            switch (info.menuItemId) {
                case 'wallabagger-add-link':
                    if (typeof (info.linkUrl) === 'string' && info.linkUrl.length > 0) {
                        savePage.handle(
                            {
                                type: 'url',
                                url: info.linkUrl,
                                resetIcon: true
                            }
                        );
                    } else {
                        browserUtils.getActiveTab().then(tab => {
                            savePage.handle(
                                {
                                    type: 'tab',
                                    tab: tab
                                }
                            );
                        });
                    }
                    break;
                case 'options':
                    browser.runtime.openOptionsPage();
                    break;
                case 'unread':
                case 'starred':
                case 'archive':
                case 'all':
                case 'tag':
                    api.checkParams() && browser.tabs.create({ url: `${api.data.Url}/${info.menuItemId}/list` });
                    break;
            }
        });
    }

    if(browser.commands !== undefined) {
        logger.log('adding onCommand listener');
        browser.commands.onCommand.addListener(async (command) => {
            if (command === 'wallabag-it') {
                browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    if (tabs[0] != null) {
                        savePage.handle(
                            {
                                type: 'url',
                                url: tabs[0].url,
                                resetIcon: false
                            }
                        );
                    }
                });
            }
        });
    }

    logger.log('adding onConnect listener');
    browser.runtime.onConnect.addListener(async (port) => {
        logger.log(port);
        logger.log('on-message');
        port.onMessage.addListener(onPortMessage);
        Port = port;
        portConnected = true;
        logger.log('posting queue ready');
        postIfConnected({ response: PortManager.backgroundPortIsConnectedEventName });

        Port.onDisconnect.addListener(function () {
            logger.log('port disconnected');
            portConnected = false;
        });
        Port.onMessage.addListener(onPortMessage);
    });
    // @TODO disabled to try to use Port
    // browser.runtime.onMessage.addListener(onPortMessage);

    logger.log('adding onInstalled listener');
    browser.runtime.onInstalled.addListener(async (details) => {
        await api.forceInit();
        if (details.reason === 'install') {
            openOptionsPage();
        }
        if (details.reason === 'update' && api.data.isFetchPermissionGranted !== true) {
            openOptionsPage();
        }
    });
    logger.log('ending');
    logger.groupEnd();
};

const contextMenusCreation = async () => {
    logger.groupCollapsed('contextMenusCreation');
    logger.log('starting');

    logger.log('adding onClicked listener');
    if (browser.contextMenus !== undefined) {
        logger.log('removing all the context menus');
        await browser.contextMenus.removeAll();

        const defaultLinkTitle = Common.translate('Wallabag_it');
        await Promise.all([
            {
                id: 'wallabagger-add-link',
                title: isBetaVersion ? '[BETA] ' + defaultLinkTitle : defaultLinkTitle,
                contexts: wallabaggerAddLinkContexts
            },
            {
                id: 'unread',
                title: Common.translate('Unread'),
                contexts: ['action']
            },
            {
                id: 'starred',
                title: Common.translate('Starred'),
                contexts: ['action']
            },
            {
                id: 'archive',
                title: Common.translate('Archive'),
                contexts: ['action']
            },
            {
                id: 'all',
                title: Common.translate('All_entries'),
                contexts: ['action']
            },
            {
                id: 'tag',
                title: Common.translate('Tags'),
                contexts: ['action']
            }
        ].map(menu => {
            logger.log(`adding context menu: ${menu.id}`);
            return browser.contextMenus.create(menu);
        }));

        if(globalThis.wallabaggerBrowser === 'Firefox') {
            logger.log('adding context menu: options');
            browser.contextMenus.create({
                id: 'options',
                title: 'Options',
                contexts: 'action' in browser ? ['action'] : ['browser_action']
            });
        }

    }
    logger.log('ending');
    logger.groupEnd();
};

async function boot () {
    logger.groupCollapsed('boot');
    logger.log('starting');
    addListeners();
    await contextMenusCreation();
    await api.init();
    existingUrl.addListeners(api.data.AllowExistCheck);
    const tags = await api.getTags();
    cache.set('allTags', tags);
    logger.log('ending');
    logger.groupEnd();
}
boot();

function goToOptionsPage (optionsPageUrl, res) {
    if (typeof (res) === 'undefined' || res.length === 0) {
        browser.tabs.create({
            url: optionsPageUrl
        });
    } else {
        browser.tabs.update(res[0].id, { active: true });
    }
}

function openOptionsPage () {
    postIfConnected({ response: 'close' });
    const optionsPageUrlFromManifest = browser.runtime.getManifest().options_ui.page;
    const optionsPageUrl = browser.runtime.getURL(optionsPageUrlFromManifest);
    try {
        browser.tabs.query({ url: optionsPageUrl }).then(res => goToOptionsPage(optionsPageUrl, res));
    } catch (e) {
        // @Opera
        browser.tabs.query({ url: optionsPageUrl }, function (res) {
            goToOptionsPage(optionsPageUrl, res);
        });
    }
}
async function savePageToWallabag (tabUrl, resetIcon, title, content, proxifiedUrl) {
    if (browserUtils.isServicePage(tabUrl, api.data.Url)) {
        return;
    }

    const url = tabUrl;
    await api.forceInit();
    if (api.checkParams() === false) {
        openOptionsPage();
        return false;
    }
    // if WIP and was some dirty changes, return dirtyCache
    const exists = existingUrl.cache.check(url) ? existingUrl.cache.get(url) : existingUrl.states.notexists;
    const hasContent = content && content.length > 0;
    const isToFetchLocally = hasContent ?? api.isSiteToFetchLocally(tabUrl);
    if (exists === existingUrl.states.wip) {
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
        // @TODO check if other parameters required
        savePageToWallabag(url, resetIcon);
        return;
    }

    // real saving
    browserIcon.set('wip');
    existingUrl.cache.set(url, existingUrl.states.wip);
    const message = isToFetchLocally ? 'Saving_the_page_to_wallabag_from_the_browser' : 'Saving_the_page_to_wallabag';
    postIfConnected({ response: 'info', text: Common.translate(message) });

    const savePageOptions = {url};

    if(proxifiedUrl) {
        savePageOptions.origin_url = proxifiedUrl;
    }

    if (isToFetchLocally) {
        logger.log('set locally fetched', { title, content });
        savePageOptions.title = title;
        savePageOptions.content = content;
        console.log(savePageOptions);
    }

    const promise = api.savePage(savePageOptions);
    promise
        .then(data => applyDirtyCacheLight(url, data))
        .then(data => {
            if (!data.deleted) {
                browserIcon.set('good');
                postIfConnected({ response: 'article', article: cutArticle(data) });
                cache.set(url, cutArticle(data));
                existingUrl.saveExistFlag(url, existingUrl.states.exists);
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
            existingUrl.saveExistFlag(url, existingUrl.states.notexists);
            postIfConnected({ response: 'error', error: { message: Common.translate('Save_Error') } });
            throw error;
        });
};


function postIfConnected (obj) {
    portConnected && Port.postMessage(obj);
    logger.log('postMessage:', obj);
}
async function onPortMessage (msg) {
    logger.log(msg);
    await api.forceInit();
    try {
        switch (msg.request) {
            case 'save':
                savePage.handle(
                    {
                        type: 'tab',
                        tab: msg.tab
                    },
                    savePageToWallabag
                );
                break;
            case 'tags':
                if (!cache.check('allTags')) {
                    api.getTags()
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
                    api.saveTitle(msg.articleId, msg.title).then(data => {
                        postIfConnected({ response: 'title', title: data.title });
                        cache.set(msg.tabUrl, cutArticle(data));
                    });
                } else {
                    dirtyCacheSet(msg.tabUrl, { title: msg.title });
                }
                break;
            case 'deleteArticle':
                if (msg.articleId !== -1) {
                    api.deleteArticle(msg.articleId).then(data => {
                        cache.clear(msg.tabUrl);
                    });
                } else {
                    dirtyCacheSet(msg.tabUrl, { deleted: true });
                }
                browserIcon.set('default');
                existingUrl.saveExistFlag(msg.tabUrl, existingUrl.states.notexists);
                break;
            case 'setup':
                logger.log('setup');
                if (!api.checkParams()) {
                    postIfConnected({ response: 'error', error: { message: Common.translate('Options_not_defined') } });
                }
                postIfConnected({ response: 'setup', data: api.data });
                break;
            case 'setup-open':
                openOptionsPage();
                break;
            case 'setup-save':
                api.saveParams(msg.data);
                postIfConnected({ response: 'setup-save', data: api.data });
                existingUrl.addListeners(msg.data.AllowExistCheck);
                break;
            case 'setup-gettoken':
                api.saveParams(msg.data);
                api.passwordToken()
                    .then(a => {
                        postIfConnected({ response: 'setup-gettoken', data: api.data, result: true });
                        if (!cache.check('allTags')) {
                            api.getTags()
                                .then(data => { cache.set('allTags', data); });
                        }
                    })
                    .catch(a => {
                        postIfConnected({ response: 'setup-gettoken', data: api.data, result: false });
                    });
                break;
            case 'setup-checkurl':
                api.saveParams(msg.data);
                api.checkUrl()
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
                    api.deleteArticleTag(msg.articleId, msg.tagId).then(data => {
                        postIfConnected({ response: 'articleTags', tags: data.tags });
                        cache.set(msg.tabUrl, cutArticle(data));
                    });
                } else {
                    dirtyCacheSet(msg.tabUrl, { tagList: msg.tags });
                }
                break;
            case 'saveTags':
                if (msg.articleId !== -1) {
                    api.saveTags(msg.articleId, msg.tags).then(data => {
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
            case 'saveStarred':
            case 'saveArchived':
                if (msg.articleId !== -1) {
                    api[msg.request](msg.articleId, msg.value ? 1 : 0).then(data => {
                        postIfConnected({ response: 'action', value: { starred: data.is_starred, archived: data.is_archived } });
                        cache.set(msg.tabUrl, cutArticle(data));
                    });
                } else {
                    dirtyCacheSet(msg.tabUrl, (msg.request === 'saveStarred') ? { is_starred: msg.value } : { is_archived: msg.value });
                }
                break;
            default: {
                logger.error('unknown request', msg);
            }
        }
    } catch (error) {
        browserIcon.setTimed('bad');
        postIfConnected({ response: 'error', error });
    }
}

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
            return api.deleteArticle(data.id).then(a => { dirtyCache.clear(key); });
        } else {
            if (data.changed !== undefined) {
                return api.patchArticle(data.id, { title: data.title, starred: data.is_starred, archive: data.is_archived, tags: data.tagList })
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
        logger.log('article to move to dirtyCache', art);
        dirtyCacheSet(url, {
            title: art.title,
            tagList: art.tags.map(tag => tag.label).join(','),
            is_archived: art.is_archived,
            is_starred: art.is_starred
        });
        cache.clear(url);
    }
}




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
    const dirtyTags = tagList.split(',').map(label => Object.assign({}, { id: dirtyId--, label, slug: label }));
    addToAllTags(dirtyTags);
};
