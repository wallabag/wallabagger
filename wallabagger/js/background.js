/* globals WallabagApi */
if (typeof (browser) === 'undefined' && typeof (chrome) === 'object') {
    browser = chrome;
}

const icon = {
    'default': browser.runtime.getManifest().browser_action.default_icon,
    'good': 'img/wallabagger-green.svg',
    'wip': 'img/wallabagger-yellow.svg',
    'bad': 'img/wallabagger-red.svg'

};

const GetApi = () => {
    const api = new WallabagApi();
    return api.init()
        .then(data => {
            if (api.needNewAppToken()) {
                return api.GetAppToken()
                    .then(r => api);
            }
            return api;
        })
        .catch(error => {
            throw error;
        });
};

browser.contextMenus.create({
    id: 'wallabagger-add-link',
    title: 'Wallabag it!',
    contexts: ['link', 'page']
});

browser.contextMenus.create({
    type: 'separator',
    contexts: ['browser_action']
});

browser.contextMenus.create({
    id: 'Unread-articles',
    title: 'Unread articles',
    contexts: ['browser_action']
});

browser.contextMenus.create({
    id: 'Favorite-articles',
    title: 'Starred articles',
    contexts: ['browser_action']
});

browser.contextMenus.create({
    id: 'Archived-articles',
    title: 'Archived articles',
    contexts: ['browser_action']
});

browser.contextMenus.create({
    id: 'All-articles',
    title: 'All articles',
    contexts: ['browser_action']
});

browser.contextMenus.create({
    id: 'Tag-list',
    title: 'Tag list',
    contexts: ['browser_action']
});

function savePageToWallabag (url) {
    browser.browserAction.setIcon({ path: icon.wip });

    GetApi().then(api => api.SavePage(url))
        .then(r => {
            browser.browserAction.setIcon({ path: icon.good });
            setTimeout(function () { browser.browserAction.setIcon({ path: icon.default }); }, 5000);
        })
        .catch(e => {
            browser.browserAction.setIcon({ path: icon.bad });
            setTimeout(function () { browser.browserAction.setIcon({ path: icon.default }); }, 5000);
        });
};

browser.contextMenus.onClicked.addListener(function (info) {
    switch (info.menuItemId) {
        case 'wallabagger-add-link':
            const url = typeof (info.linkUrl) === 'string' ? info.linkUrl : info.pageUrl;
            savePageToWallabag(url);
            break;
        case 'Unread-articles':
            GotoWallabag('unread');
            break;
        case 'Favorite-articles':
            GotoWallabag('starred');
            break;
        case 'Archived-articles':
            GotoWallabag('archive');
            break;
        case 'All-articles':
            GotoWallabag('all');
            break;
        case 'Tag-list':
            GotoWallabag('tag');
            break;
    }
});

const GotoWallabag = (part) =>
    GetApi().then(api => browser.tabs.create({ url: `${api.data.Url}/${part}/list` }));

browser.commands.onCommand.addListener(function (command) {
    if (command === 'wallabag-it') {
        browser.tabs.query({ 'active': true }, function (tabs) {
            if (tabs[0] != null) {
                savePageToWallabag(tabs[0].url);
            }
        });
    }
});

GetApi().then(api => {
    api.resetDebug();
    if (api.data.AllowExistCheck) {
        browser.tabs.onActivated.addListener(function (activeInfo) {
            browser.browserAction.setIcon({ path: icon.default });
            const { tabId } = activeInfo;
            browser.tabs.get(tabId, function (tab) {
                checkExist(tab.url);
            });
        });

        browser.tabs.onCreated.addListener(function (tab) {
            browser.browserAction.setIcon({ path: icon.default });
        });

        browser.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
            if (changeInfo.status === 'loading' && tab.active) {
                requestExists(tab.url);
            }
        });

        browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
            const {type, url} = request;
            switch (type) {
                case 'begin' :
                    browser.browserAction.setIcon({ path: icon.wip });
                    break;
                case 'success' :
                    browser.browserAction.setIcon({ path: icon.good });
                    saveExistFlag(url, true);
                    break;
                case 'error' :
                    browser.browserAction.setIcon({ path: icon.bad });
                    setTimeout(function () { browser.browserAction.setIcon({ path: icon.default }); }, 5000);
                    break;
            }
        });
    };
});

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
    GetApi()
    .then(api => api.EntryExists(url))
    .then(data => {
        const existsIcon = data.exists ? icon.good : icon.default;
        browser.browserAction.setIcon({ path: existsIcon });
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

// const slash = (url) => url.match(/(\w+)\.html?$/) ? url : url.replace(/\/?$/, '/');

const isServicePage = (url) => /^(chrome|about|browser):(.*)/.test(url);
