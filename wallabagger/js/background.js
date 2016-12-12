if (typeof (browser) === 'undefined' && typeof (chrome) === 'object') {
    browser = chrome;
}
const GetApi = () => {

    const api = new WallabagApi();

    return api.load()
        .then(data => {
            if (api.needNewAppToken()) {
                return api.GetAppToken().then(r => api);
            }
            return api;
        })
        .catch(error => {
            throw error;
        });
}

let browserActionIconDefault = browser.runtime.getManifest().browser_action.default_icon;

browser.contextMenus.create({
    id: "wallabagger-add-link",
    title: "Wallabag it!",
    contexts: ["link", "page"]
});

browser.contextMenus.create({
    type: "separator",
    contexts: ["browser_action"]
});

browser.contextMenus.create({
    id: "Unread-articles",
    title: "Unread articles",
    contexts: ["browser_action"]
});

browser.contextMenus.create({
    id: "Favorite-articles",
    title: "Starred articles",
    contexts: ["browser_action"]
});

browser.contextMenus.create({
    id: "Archived-articles",
    title: "Archived articles",
    contexts: ["browser_action"]
});

browser.contextMenus.create({
    id: "All-articles",
    title: "All articles",
    contexts: ["browser_action"]
});

browser.contextMenus.create({
    id: "Tag-list",
    title: "Tag list",
    contexts: ["browser_action"]
});

function savePageToWallabag(url) {

    browser.browserAction.setIcon({ path: 'img/wallabagger-yellow.svg' });

    GetApi().then(api => api.SavePage(url))
        .then(r => {
            browser.browserAction.setIcon({ path: 'img/wallabagger-green.svg' });
            setTimeout(function () { browser.browserAction.setIcon({ path: browserActionIconDefault }); }, 5000);
        })
        .catch(e => {
            browser.browserAction.setIcon({ path: 'img/wallabagger-red.svg' });
            setTimeout(function () { browser.browserAction.setIcon({ path: browserActionIconDefault }); }, 5000);
        });

};

browser.contextMenus.onClicked.addListener(function (info) {

    switch (info.menuItemId) {
        case "wallabagger-add-link":

            const url = typeof (info.linkUrl) === 'string' ? info.linkUrl : info.pageUrl;

            savePageToWallabag(url);

            break;
        case "Unread-articles":
            GotoWallabag("unread");
            break;
        case "Favorite-articles":
            GotoWallabag("starred");
            break;
        case "Archived-articles":
            GotoWallabag("archive");
            break;
        case "All-articles":
            GotoWallabag("all");
            break;
        case "Tag-list":
            GotoWallabag("tag");
            break;
    }

});

const GotoWallabag = (part) =>
    GetApi().then(api => chrome.tabs.create({ url: `${api.data.Url}/${part}/list` }));

browser.commands.onCommand.addListener(function (command) {

    if (command == "wallabag-it") {
        browser.tabs.query({ 'active': true }, function (tabs) {
            if (tabs[0] != null) {
                savePageToWallabag(tabs[0].url);
            }
        });
    }

});